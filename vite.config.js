import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In-memory rate limiting for Vite dev server: max 10 requests per minute per IP
const devRateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 10

function checkDevRateLimit(ip) {
  const now = Date.now()
  const timestamps = devRateLimitMap.get(ip) || []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    devRateLimitMap.set(ip, recent)
    return false
  }

  recent.push(now)
  devRateLimitMap.set(ip, recent)
  return true
}

// Custom Vite middleware plugin to securely handle /api/ask-advisor
function geminiAdvisorPlugin() {
  return {
    name: 'gemini-advisor-middleware',
    configureServer(server) {
      server.middlewares.use('/api/ask-advisor', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })

        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json')
          try {
            const { prompt, lang = 'en' } = JSON.parse(body || '{}')

            // 1. Validation: Reject prompts that are empty, not a string, or longer than 300 characters
            if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
              res.end(JSON.stringify({
                fallbackNeeded: true,
                source: 'offline',
                message: 'Please ask a question about sustainability or waste management.'
              }))
              return
            }

            if (prompt.trim().length > 300) {
              res.end(JSON.stringify({
                fallbackNeeded: true,
                source: 'offline',
                message: 'Question exceeds maximum limit of 300 characters. Please shorten it.'
              }))
              return
            }

            // 2. Rate limiting by IP
            const forwarded = req.headers['x-forwarded-for']
            const clientIp = (
              (typeof forwarded === 'string' ? forwarded.split(',')[0] : null) ||
              req.headers['x-real-ip'] ||
              req.socket?.remoteAddress ||
              '127.0.0.1'
            ).trim()

            if (!checkDevRateLimit(clientIp)) {
              res.end(JSON.stringify({
                fallbackNeeded: true,
                source: 'offline',
                message: 'Rate limit reached (max 10 requests per minute). Serving offline advice.'
              }))
              return
            }

            // 3. API key check without exposing secret
            const apiKey = process.env.GEMINI_API_KEY

            if (!apiKey) {
              res.end(JSON.stringify({
                fallbackNeeded: true,
                source: 'offline',
                message: 'GEMINI_API_KEY not configured in environment; using offline knowledge base.'
              }))
              return
            }

            const systemInstruction = `You are "What Else Sustain AI Advisor", an expert assistant helping students, farmers, and everyday people adopt practical, low-cost sustainable alternatives.
RULES:
1. Answer in the user's requested language: if lang is "te", respond strictly in natural, conversational Telugu; if "en", respond in English.
2. Provide maximum 2 to 3 practical, low-cost options.
3. For each option, clearly state:
   - Option title with an emoji
   - Approximate Cost (ఖర్చు)
   - Effort Level (శ్రమ: Low/Medium/High)
   - Brief practical how-to action step
4. CRITICAL DATA RULE: Do NOT invent statistics or exact figures. If exact numbers are uncertain, explicitly state that these are approximate regional estimates.
5. Keep the total response under 180 words, formatted with clean bullet points.`

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
            
            const geminiResponse = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemInstruction }]
                },
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: `User Language: ${lang}\nQuestion: ${prompt.trim()}` }]
                  }
                ],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 600
                }
              })
            })

            // Never echo raw upstream error bodies
            if (!geminiResponse.ok) {
              res.end(JSON.stringify({
                fallbackNeeded: true,
                source: 'offline',
                message: 'AI advisor is temporarily unavailable; using offline knowledge base.'
              }))
              return
            }

            const data = await geminiResponse.json()
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

            if (!textResponse) {
              res.end(JSON.stringify({
                fallbackNeeded: true,
                source: 'offline',
                message: 'AI response was empty; using offline knowledge base.'
              }))
              return
            }

            res.end(JSON.stringify({
              answer: textResponse,
              source: 'gemini',
              model: 'gemini-2.5-flash'
            }))
          } catch {
            // Never echo raw error stack, upstream error body, or API key
            res.end(JSON.stringify({
              fallbackNeeded: true,
              source: 'offline',
              message: 'Service error; using offline knowledge base.'
            }))
          }
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), geminiAdvisorPlugin()],
  server: {
    port: 5173,
    host: true
  }
})

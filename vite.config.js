import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom Vite middleware plugin to securely handle /api/ask-advisor
function geminiAdvisorPlugin() {
  return {
    name: 'gemini-advisor-middleware',
    configureServer(server) {
      server.middlewares.use('/api/ask-advisor', async (req, res, next) => {
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
          try {
            const { prompt, lang = 'en' } = JSON.parse(body || '{}')
            const apiKey = process.env.GEMINI_API_KEY

            if (!apiKey) {
              res.setHeader('Content-Type', 'application/json')
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
                    parts: [{ text: `User Language: ${lang}\nQuestion: ${prompt}` }]
                  }
                ],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 600
                }
              })
            })

            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text()
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                fallbackNeeded: true,
                source: 'offline',
                error: `Gemini API error: ${errText}`
              }))
              return
            }

            const data = await geminiResponse.json()
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              answer: textResponse,
              source: 'gemini',
              model: 'gemini-2.5-flash'
            }))
          } catch (err) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              fallbackNeeded: true,
              source: 'offline',
              error: err.message
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

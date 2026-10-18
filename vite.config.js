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

            // 3. API key check with rotation support across comma-separated keys
            const rawKeys = `${process.env.GEMINI_API_KEYS || ''},${process.env.GEMINI_API_KEY || ''}`
            const keyPool = rawKeys.split(',').map((k) => k.trim()).filter(Boolean)

            if (keyPool.length === 0) {
              res.end(JSON.stringify({
                fallbackNeeded: true,
                source: 'offline',
                message: 'GEMINI_API_KEY not configured in environment; using offline knowledge base.'
              }))
              return
            }

            const systemInstruction = `You are "What Else Sustain AI Advisor", an expert assistant helping students, farmers, and families adopt practical, low-cost sustainable alternatives.
RULES:
1. Respond strictly in clear, friendly English.
2. Provide 2 to 3 practical, low-cost options.
3. For each option, clearly state:
   - Option title with an emoji
   - Approximate Cost
   - Effort Level (Low/Medium/High)
   - Brief practical action step
4. CRITICAL DATA INTEGRITY: Do NOT invent statistics or exact figures. If exact numbers are uncertain, state that these are approximate regional estimates.
5. Keep the total response under 180 words, formatted with clean bullet points.`

            let textResponse = null
            let reachedQuota = false

            // Key rotation loop
            for (const key of keyPool) {
              const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`
              try {
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
                        parts: [{ text: `Question: ${prompt.trim()}` }]
                      }
                    ],
                    generationConfig: {
                      temperature: 0.2,
                      maxOutputTokens: 600
                    }
                  })
                })

                if (geminiResponse.status === 429) {
                  reachedQuota = true
                  continue // Try next key in rotation
                }

                if (!geminiResponse.ok) {
                  continue
                }

                const data = await geminiResponse.json()
                const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text
                if (candidateText && candidateText.trim()) {
                  textResponse = candidateText.trim()
                  break
                }
              } catch {
                continue
              }
            }

            if (!textResponse) {
              res.end(JSON.stringify({
                fallbackNeeded: true,
                source: 'offline',
                message: reachedQuota
                  ? 'Free quota limit reached on key; using offline knowledge base.'
                  : 'AI advisor is temporarily unavailable; using offline knowledge base.'
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
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-framer': ['framer-motion'],
          'vendor-howler': ['howler'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    }
  }
})


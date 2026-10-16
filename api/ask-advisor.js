/**
 * Serverless Function Handler for Gemini AI Advisor
 * Safe for Vercel, Netlify, or Node.js backends.
 * Reads GEMINI_API_KEY from environment variables.
 */

// In-memory rate limiting: max 10 requests per minute per IP
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 10

function checkRateLimit(ip) {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []

  // Filter out timestamps older than the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, recent)
    return false // Limit exceeded
  }

  recent.push(now)
  rateLimitMap.set(ip, recent)
  return true // Allowed
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, lang = 'en' } = req.body || {}

  // 1. Validation: Reject prompts that are empty, not a string, or longer than 300 characters
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(200).json({
      fallbackNeeded: true,
      source: 'offline',
      message: 'Please ask a question about sustainability or waste management.'
    })
  }

  if (prompt.trim().length > 300) {
    return res.status(200).json({
      fallbackNeeded: true,
      source: 'offline',
      message: 'Question exceeds maximum limit of 300 characters. Please shorten it.'
    })
  }

  // 2. In-memory rate limiting per IP (max 10 requests per minute)
  const forwarded = req.headers['x-forwarded-for']
  const clientIp = (
    (typeof forwarded === 'string' ? forwarded.split(',')[0] : null) ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  ).trim()

  if (!checkRateLimit(clientIp)) {
    return res.status(200).json({
      fallbackNeeded: true,
      source: 'offline',
      message: 'Rate limit reached (max 10 requests per minute). Serving offline advice.'
    })
  }

  // 3. API key resolution without exposing secret
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return res.status(200).json({
      fallbackNeeded: true,
      source: 'offline',
      message: 'GEMINI_API_KEY is not configured in environment.'
    })
  }

  const systemInstruction = `You are "What Else Sustain AI Advisor", an expert assistant helping students, farmers, and rural families adopt practical, low-cost sustainable alternatives.
RULES:
1. Answer in the requested language: if lang is "te", respond in natural, conversational Telugu; if "en", respond in English.
2. Provide maximum 2 to 3 practical, low-cost options.
3. For each option, clearly state:
   - Title with an emoji
   - Approximate Cost (ఖర్చు)
   - Effort Level (శ్రమ: Low/Medium/High)
   - Brief practical action step
4. DATA INTEGRITY: Do NOT invent statistics or exact numbers. Admit uncertainty and label numbers as regional approximations.
5. Keep response under 180 words with clean formatting.`

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [
          { role: 'user', parts: [{ text: `User Language: ${lang}\nQuestion: ${prompt.trim()}` }] }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600
        }
      })
    })

    // Never echo raw upstream error bodies
    if (!response.ok) {
      return res.status(200).json({
        fallbackNeeded: true,
        source: 'offline',
        message: 'AI advisor is temporarily unavailable; using offline knowledge base.'
      })
    }

    const data = await response.json()
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textResponse) {
      return res.status(200).json({
        fallbackNeeded: true,
        source: 'offline',
        message: 'AI response was empty; using offline knowledge base.'
      })
    }

    return res.status(200).json({
      answer: textResponse,
      source: 'gemini'
    })
  } catch {
    // Never echo raw error stack, upstream error body, or API key to client
    return res.status(200).json({
      fallbackNeeded: true,
      source: 'offline',
      message: 'Network issue reaching AI service; using offline knowledge base.'
    })
  }
}

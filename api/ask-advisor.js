/**
 * Serverless Function Handler for Gemini AI Advisor
 * Safe for Vercel, Netlify, or Node.js backends.
 * Reads GEMINI_API_KEY from environment variables.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, lang = 'en' } = req.body || {}
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return res.status(200).json({
      fallbackNeeded: true,
      source: 'offline',
      message: 'GEMINI_API_KEY is not set in environment.'
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
          { role: 'user', parts: [{ text: `User Language: ${lang}\nQuestion: ${prompt}` }] }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600
        }
      })
    })

    if (!response.ok) {
      return res.status(200).json({
        fallbackNeeded: true,
        source: 'offline',
        error: 'Upstream Gemini API error'
      })
    }

    const data = await response.json()
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

    return res.status(200).json({
      answer: textResponse,
      source: 'gemini'
    })
  } catch (error) {
    return res.status(200).json({
      fallbackNeeded: true,
      source: 'offline',
      error: error.message
    })
  }
}

// AI-powered job description generation
// Calls the Vercel serverless function at /api/ai-generate which proxies to Anthropic.
// The API key lives on the server (ANTHROPIC_API_KEY), not exposed to the browser.
//
// Fallback: if VITE_ANTHROPIC_API_KEY is set, we call Anthropic directly (for local dev).

const DIRECT_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

export async function generateJobDescription(input) {
  // Prefer the server-side proxy (production)
  try {
    const response = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (response.ok) {
      return await response.json()
    }
    const errData = await response.json().catch(() => ({}))
    const errMsg = errData.error || `AI generation failed (${response.status})`

    // If proxy isn't configured and we have a direct key, fall back (for dev)
    if (response.status === 500 && errMsg.includes('not configured') && DIRECT_API_KEY) {
      return callAnthropicDirect(input)
    }
    throw new Error(errMsg)
  } catch (err) {
    if (DIRECT_API_KEY) {
      try {
        return await callAnthropicDirect(input)
      } catch (directErr) {
        throw new Error(directErr.message || err.message || 'AI unavailable')
      }
    }
    throw err
  }
}

async function callAnthropicDirect({ title, company, duration, type, skills, gradeLevel }) {
  const gradeLevelText = gradeLevel
    ? `Target students: ${gradeLevel} (youth internship program, 10th grade through college).`
    : 'Youth internship program for students from 10th grade through college.'

  const prompt = `You are helping an employer write a compelling internship posting for the NRIVA Youth Internship Program. ${gradeLevelText}

Position: ${title || 'Internship'}
Company: ${company || 'Not specified'}
Duration: ${duration || 'Not specified'}
Type: ${type || 'Not specified'}
Skills: ${skills || 'Not specified'}

Return ONLY a JSON object (no markdown):
{
  "description": "2-3 paragraph description",
  "responsibilities": "5-6 responsibilities, each starting with \u2022",
  "requirements": "4-5 requirements, each starting with \u2022",
  "preferredQualifications": "3-4 items, each starting with \u2022",
  "benefits": "4-5 benefits, each starting with \u2022"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': DIRECT_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    if (response.status === 400 && errText.includes('credit balance')) {
      throw new Error('Anthropic API credits depleted. Add credits at console.anthropic.com/settings/billing')
    }
    if (response.status === 401) throw new Error('Invalid Anthropic API key.')
    if (response.status === 429) throw new Error('Rate limit reached. Try again in a few seconds.')
    throw new Error(`AI generation failed (${response.status})`)
  }

  const data = await response.json()
  const text = data.content[0].text.trim()
  try {
    return JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error('Failed to parse AI response')
  }
}

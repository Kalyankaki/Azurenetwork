// Vercel serverless function (Node.js runtime)
// Proxies Anthropic API calls so the API key stays on the server.
// Environment variable: ANTHROPIC_API_KEY (set in Vercel, NOT prefixed with VITE_)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return res.status(500).json({
      error: 'AI feature not configured. Set ANTHROPIC_API_KEY in Vercel environment variables.',
    })
  }

  const body = req.body || {}
  const { title, company, duration, type, skills, gradeLevel } = body

  const gradeLevelText = gradeLevel
    ? `Target students: ${gradeLevel} (youth internship program, 10th grade through college).`
    : 'Youth internship program for students from 10th grade through college.'

  const prompt = `You are helping an employer write a compelling internship posting for the NRIVA (NRI Vasavi Association) Youth Internship Program. ${gradeLevelText}

Generate a professional internship description. Keep the language appropriate for high school and college students. Be encouraging and educational.

Position: ${title || 'Internship'}
Company: ${company || 'Not specified'}
Duration: ${duration || 'Not specified'}
Type: ${type || 'Not specified'}
Skills: ${skills || 'Not specified'}

Return ONLY a JSON object with these keys (no markdown, no code fences):
{
  "description": "2-3 paragraph description of the role, projects, and learning opportunities",
  "responsibilities": "5-6 key responsibilities, one per line, each starting with a bullet \u2022",
  "requirements": "4-5 minimum requirements appropriate for the grade level, one per line, each starting with a bullet \u2022",
  "preferredQualifications": "3-4 nice-to-have qualifications, one per line, each starting with a bullet \u2022",
  "benefits": "4-5 benefits/perks including mentorship and learning, one per line, each starting with a bullet \u2022"
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
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
        return res.status(402).json({
          error: 'Anthropic API credits depleted. Admin must add credits at console.anthropic.com/settings/billing',
        })
      }
      if (response.status === 401) {
        return res.status(500).json({ error: 'Invalid Anthropic API key on server.' })
      }
      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit reached. Try again in a few seconds.' })
      }
      return res.status(response.status).json({
        error: `AI generation failed: ${errText.slice(0, 200)}`,
      })
    }

    const data = await response.json()
    const text = (data.content?.[0]?.text || '').trim()

    try {
      return res.status(200).json(JSON.parse(text))
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) return res.status(200).json(JSON.parse(jsonMatch[0]))
      return res.status(500).json({ error: 'Failed to parse AI response' })
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' })
  }
}

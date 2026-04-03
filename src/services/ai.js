// AI-powered job description generation using Claude API
// The API key should be set in Vercel env vars as VITE_ANTHROPIC_API_KEY

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

export async function generateJobDescription({ title, company, duration, type, skills, gradeLevel }) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('AI features require an Anthropic API key. Set VITE_ANTHROPIC_API_KEY in your environment.')
  }

  const gradeLevelText = gradeLevel
    ? `Target students: ${gradeLevel} (this is a youth internship program for students from 10th grade through college).`
    : 'This is a youth internship program for students from 10th grade through college.'

  const prompt = `You are helping an employer write a compelling internship posting for the NRIVA (NRI Vasavi Association) Youth Internship Program. ${gradeLevelText}

Generate a professional internship description with the following sections. Keep the language appropriate for high school and college students. Be encouraging and educational in tone.

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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
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
    const err = await response.text()
    throw new Error(`AI generation failed: ${response.status} - ${err}`)
  }

  const data = await response.json()
  const text = data.content[0].text.trim()

  try {
    return JSON.parse(text)
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error('Failed to parse AI response')
  }
}

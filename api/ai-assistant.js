// AI Assistant - Vercel serverless function
// Provides role-specific help using Claude

import { rateLimit } from './_rateLimit.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (rateLimit(req, res, { maxRequests: 15 })) return

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(500).json({ error: 'AI not configured' })

  const { message, role, context } = req.body || {}
  if (!message) return res.status(400).json({ error: 'Message required' })

  const systemPrompts = {
    intern: `You are a friendly AI assistant for the NRIVA Youth Committee Internship Portal, helping an INTERN (student, 10th grade through college).

You can help with:
- How to browse and apply for internships
- Understanding internship details and requirements
- Tracking application status
- Tips for writing good applications
- Understanding the offer/acceptance workflow
- General questions about the NRIVA internship program

Current context about available internships and the student's profile:
${context || 'No specific context provided.'}

Keep responses concise (2-3 sentences for simple questions, up to a short paragraph for complex ones). Be encouraging and supportive. Use casual, Gen-Z-friendly tone. If asked something outside the portal, politely redirect.`,

    employer: `You are an AI assistant for the NRIVA Youth Committee Internship Portal, helping an EMPLOYER.

You can help with:
- How to post internship opportunities
- Using the AI "Write with AI" feature for job descriptions
- Understanding the candidate matching algorithm
- Filtering and selecting candidates (the Top 5 and All Matches tabs)
- The offer/acceptance workflow
- Sending onboarding emails to accepted interns
- Understanding match scores and what they mean

Current context about the employer's internships and applicants:
${context || 'No specific context provided.'}

Be professional but warm. Keep responses concise and actionable. If asked to filter/rank candidates, explain what criteria to look for based on the match scores.`,

    admin: `You are an AI assistant for the NRIVA Youth Committee Internship Portal, helping a PROGRAM ADMINISTRATOR.

You can help with:
- Managing users and role assignments
- Approving/rejecting internship postings
- Understanding the application pipeline and stale alerts
- Using reports and CSV exports
- Employer performance tracking
- Managing NRIVA coordinators
- Handling messages and issues from users
- Understanding the activity log
- Program metrics and how to improve them

Current context about program state:
${context || 'No specific context provided.'}

Be efficient and direct. Focus on actionable advice. Use data-driven language.`,
  }

  const systemPrompt = systemPrompts[role] || systemPrompts.intern

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
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      if (response.status === 429) return res.status(429).json({ error: 'Too many requests. Try again in a moment.' })
      return res.status(response.status).json({ error: `AI error: ${err.slice(0, 100)}` })
    }

    const data = await response.json()
    return res.status(200).json({ reply: data.content[0].text })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'AI unavailable' })
  }
}

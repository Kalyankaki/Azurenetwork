// AI-powered job description generation
// All calls go through the server-side proxy at /api/ai-generate
// API key is NEVER exposed to the browser

export async function generateJobDescription(input) {
  const response = await fetch('/api/ai-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    const errMsg = errData.error || `AI generation failed (${response.status})`
    throw new Error(errMsg)
  }

  return await response.json()
}

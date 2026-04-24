// Public stats endpoint
// Reads internships (public read rule) and returns aggregate counts
// For user count, we read from a public stats doc that gets updated by the app

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600')

  const projectId = process.env.FIREBASE_PROJECT_ID
  const apiKey = process.env.FIREBASE_API_KEY
  if (!projectId || !apiKey) {
    return res.status(200).json({ students: 0, internships: 0, companies: 0 })
  }

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`

  try {
    // Query internships (public read allowed)
    const internRes = await fetch(
      `${baseUrl}:runQuery?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'internships' }],
            select: { fields: [{ fieldPath: 'status' }, { fieldPath: 'company' }] },
            limit: 500,
          }
        }),
      }
    )

    let openInternships = 0
    const companies = new Set()

    if (internRes.ok) {
      const results = await internRes.json()
      results.forEach(r => {
        if (!r.document) return
        const fields = r.document.fields || {}
        if (fields.status?.stringValue === 'open') openInternships++
        if (fields.company?.stringValue) companies.add(fields.company.stringValue)
      })
    }

    // Read public stats doc (public read rule)
    let students = 0
    try {
      const statsRes = await fetch(`${baseUrl}/public_stats/counts?key=${apiKey}`)
      if (statsRes.ok) {
        const data = await statsRes.json()
        students = parseInt(data.fields?.students?.integerValue || '0', 10)
      }
    } catch { /* fallback to 0 */ }

    return res.status(200).json({
      students,
      internships: openInternships,
      companies: companies.size,
    })
  } catch (err) {
    console.error('Public stats error:', err)
    return res.status(200).json({ students: 0, internships: 0, companies: 0 })
  }
}

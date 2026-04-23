// Vercel serverless function - returns public stats without auth
// Reads from Firestore using admin SDK or service account

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function getDb() {
  if (getApps().length === 0) {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      initializeApp({ credential: cert(sa) })
    } else if (projectId) {
      initializeApp({ projectId })
    } else {
      return null
    }
  }
  return getFirestore()
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

  try {
    const db = getDb()
    if (!db) {
      return res.status(200).json({ students: 0, internships: 0, companies: 0 })
    }

    const [internSnap, userSnap] = await Promise.all([
      db.collection('internships').get(),
      db.collection('users').get(),
    ])

    let openInternships = 0
    const companies = new Set()
    internSnap.forEach(doc => {
      const d = doc.data()
      if (d.status === 'open') openInternships++
      if (d.company) companies.add(d.company)
    })

    let students = 0
    userSnap.forEach(doc => {
      const d = doc.data()
      if ((d.roles || []).includes('intern') || d.requestedRole === 'intern') students++
    })

    return res.status(200).json({
      students,
      internships: openInternships,
      companies: companies.size,
    })
  } catch (err) {
    console.error('Stats error:', err)
    return res.status(200).json({ students: 0, internships: 0, companies: 0 })
  }
}

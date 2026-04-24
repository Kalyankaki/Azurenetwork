// Simple in-memory rate limiter for Vercel serverless functions
// Note: In-memory state resets on cold starts, but provides basic protection

const store = new Map()
const WINDOW_MS = 60 * 1000 // 1 minute
const CLEANUP_INTERVAL = 5 * 60 * 1000 // cleanup every 5 min

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of store) {
    if (now - val.start > WINDOW_MS * 2) store.delete(key)
  }
}, CLEANUP_INTERVAL)

export function rateLimit(req, res, { maxRequests = 10 } = {}) {
  const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim()
  const key = `${ip}:${req.url}`
  const now = Date.now()

  const record = store.get(key)
  if (!record || now - record.start > WINDOW_MS) {
    store.set(key, { count: 1, start: now })
    return false // not limited
  }

  record.count++
  if (record.count > maxRequests) {
    res.setHeader('Retry-After', '60')
    res.status(429).json({ error: 'Too many requests. Please try again in a minute.' })
    return true // rate limited
  }

  return false
}

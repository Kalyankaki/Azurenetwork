// Convert a Firestore Timestamp, Date, or string to a JS Date
function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  if (val instanceof Date) return val
  if (val.seconds) return new Date(val.seconds * 1000)
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

// Safely format a date that could be a string, Date, or Firestore Timestamp
export function formatDate(val) {
  const d = toDate(val)
  return d ? d.toLocaleDateString() : '—'
}

// Add days to a date value, returning a JS Date (or null if invalid)
export function addDays(val, days) {
  const d = toDate(val)
  if (!d) return null
  return new Date(d.getTime() + days * 86400000)
}

// Check if a date is in the past
export function isPastDate(val) {
  const d = toDate(val)
  if (!d) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

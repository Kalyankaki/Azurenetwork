// Safely format a date that could be a string, Date, or Firestore Timestamp
export function formatDate(val) {
  if (!val) return '\u2014'
  // Firestore Timestamp object
  if (val.toDate) return val.toDate().toLocaleDateString()
  // Already a Date
  if (val instanceof Date) return val.toLocaleDateString()
  // Firestore Timestamp as plain object (seconds field)
  if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString()
  // String date
  const d = new Date(val)
  return isNaN(d.getTime()) ? '\u2014' : d.toLocaleDateString()
}

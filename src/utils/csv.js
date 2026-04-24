// Convert array of objects to CSV and trigger download
export function exportCSV(data, filename) {
  if (!data || data.length === 0) return

  // Get all unique keys
  const keys = Array.from(new Set(data.flatMap(Object.keys)))
  // Filter out complex objects and internal fields
  const columns = keys.filter(k => !['id', 'createdAt', 'updatedAt', 'appliedDate', 'approvedAt', 'resolvedAt'].includes(k))

  const escape = (val) => {
    if (val === null || val === undefined) return ''
    const str = Array.isArray(val) ? val.join(', ') : String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const header = columns.join(',')
  const rows = data.map(row => columns.map(col => escape(row[col])).join(','))
  const csv = [header, ...rows].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

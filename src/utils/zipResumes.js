import JSZip from 'jszip'

// Sanitises a string for use as a filename inside a zip. Strips slashes,
// control characters, and trims trailing dots / whitespace. Falls back to a
// non-empty default if everything's stripped.
function sanitiseFilename(name, fallback = 'file') {
  const clean = (name || '')
    .replace(/[/\\?%*:|"<>\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
  return clean || fallback
}

// Best-effort extension guesser when the original resumeName isn't on the
// applicant doc. Inspects the URL path; defaults to .pdf.
function extensionFromUrl(url) {
  try {
    const path = new URL(url).pathname
    const m = path.match(/\.([a-zA-Z0-9]{2,5})$/)
    if (m) return m[1].toLowerCase()
  } catch { /* fall through */ }
  return 'pdf'
}

/**
 * Fetch each candidate's resume and package them into a single ZIP for
 * download. Returns { downloaded, skipped } counts.
 *
 * Each candidate should have `resumeUrl`, `applicantName`, and optionally
 * `resumeName`. Missing or unfetchable resumes are skipped (not fatal).
 */
export async function downloadResumesZip(candidates, zipName = 'resumes.zip') {
  const usable = (candidates || []).filter(c => c?.resumeUrl)
  if (usable.length === 0) {
    return { downloaded: 0, skipped: 0 }
  }

  const zip = new JSZip()
  const seen = new Set()
  let downloaded = 0
  let skipped = 0

  for (const c of usable) {
    try {
      const res = await fetch(c.resumeUrl)
      if (!res.ok) { skipped += 1; continue }
      const buf = await res.arrayBuffer()
      const applicant = sanitiseFilename(c.applicantName || 'applicant')
      let base
      if (c.resumeName) {
        base = sanitiseFilename(c.resumeName, `resume.${extensionFromUrl(c.resumeUrl)}`)
      } else {
        base = `resume.${extensionFromUrl(c.resumeUrl)}`
      }
      let entry = `${applicant} - ${base}`
      // De-dup if two applicants share a name + filename.
      if (seen.has(entry)) {
        let n = 2
        while (seen.has(`${applicant} (${n}) - ${base}`)) n += 1
        entry = `${applicant} (${n}) - ${base}`
      }
      seen.add(entry)
      zip.file(entry, buf)
      downloaded += 1
    } catch {
      skipped += 1
    }
  }

  if (downloaded === 0) {
    return { downloaded, skipped }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = sanitiseFilename(zipName, 'resumes.zip')
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  return { downloaded, skipped }
}

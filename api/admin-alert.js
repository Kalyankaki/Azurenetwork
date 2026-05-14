// /api/admin-alert
// Receives sensitive-action notifications from the client and emails the admin
// allowlist via Resend. Falls back silently if Resend is not configured — the
// client also writes a fallback notification doc.

import { rateLimit } from './_rateLimit.js'

const ACTION_LABELS = {
  roles_changed: 'User roles changed',
  user_deleted: 'User account deleted',
  employer_approved: 'Employer approved',
  internship_approved: 'Internship approved',
  internship_rejected: 'Internship rejected',
  internship_deleted: 'Internship deleted',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (rateLimit(req, res, { maxRequests: 30 })) return

  const resendKey = process.env.RESEND_API_KEY
  const adminEmails = (process.env.ADMIN_ALERT_EMAILS || process.env.SUPER_ADMIN_EMAILS || 'abhikaki123@gmail.com')
    .split(',').map(s => s.trim()).filter(Boolean)

  if (!resendKey) {
    // No Resend configured — accept the call so the client can fall back to firestore
    return res.status(202).json({ skipped: true, reason: 'no_resend_key' })
  }

  const { action, data, occurredAt } = req.body || {}
  if (!action) return res.status(400).json({ error: 'action required' })

  const label = ACTION_LABELS[action] || action
  const safeData = JSON.stringify(data || {}, null, 2).slice(0, 4000)

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'NRIVA Internship Portal <noreply@nriva.org>',
        to: adminEmails,
        subject: `[Alert] ${label}`,
        html: `
          <h2>Admin Alert: ${label}</h2>
          <p><strong>Action:</strong> <code>${action}</code></p>
          <p><strong>Occurred at:</strong> ${occurredAt || 'unknown'}</p>
          <h3>Payload</h3>
          <pre style="background:#f1f5f9;padding:12px;border-radius:6px;font-size:12px;overflow:auto">${safeData}</pre>
          <p style="font-size:11px;color:#94a3b8;margin-top:24px">
            Sent by the NRIVA Internship Portal admin-alerts pipeline.
            Adjust recipients via the ADMIN_ALERT_EMAILS environment variable.
          </p>
        `,
      }),
    })
    if (!r.ok) {
      const text = await r.text().catch(() => '')
      console.warn('admin-alert resend failed:', r.status, text)
      return res.status(202).json({ sent: false })
    }
    return res.status(200).json({ sent: true })
  } catch (err) {
    console.warn('admin-alert error:', err?.message)
    return res.status(202).json({ sent: false })
  }
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createMessage } from '../services/firestore'

const REPORT_REASONS = [
  { value: 'misleading', label: 'Misleading or inaccurate information' },
  { value: 'unsafe', label: 'Unsafe or unlawful work' },
  { value: 'compensation', label: 'Compensation / fee concerns' },
  { value: 'minor_safety', label: 'Concerns about minor safety / supervision' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Other' },
]

// Drop-in button that opens a modal letting a signed-in user report an
// internship posting. The submission is created as a `messages` doc with
// category 'posting_report', which lands in /admin/messages for triage.
// Anonymous reporting is intentionally not supported (spam vector); users
// who aren't logged in are routed to /login first.
export default function ReportPostingButton({ internshipId, internshipTitle, company, style, label }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('misleading')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setResult(null)
    setReason('misleading')
    setDetails('')
    setOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await createMessage({
        category: 'posting_report',
        subject: `Report: ${internshipTitle || internshipId}`,
        body: details.trim() || '(no additional details provided)',
        reason,
        internshipId,
        internshipTitle: internshipTitle || '',
        company: company || '',
        senderUid: user?.uid || '',
        senderEmail: user?.email || '',
        senderName: user?.displayName || '',
      })
      setResult('ok')
    } catch (err) {
      setResult('error: ' + (err?.message || 'Could not submit report'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick} style={{
        background: 'transparent',
        border: 0,
        padding: 0,
        color: 'inherit',
        cursor: 'pointer',
        textDecoration: 'underline',
        font: 'inherit',
        ...style,
      }}>
        {label || 'Report this posting'}
      </button>

      {open && (
        <div style={overlayStyle} onClick={() => setOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={headerStyle}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1a237e' }}>
                Report this posting
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {result === 'ok' ? (
              <div style={bodyStyle}>
                <p style={{ fontSize: 14, color: '#15803d', margin: 0 }}>
                  Thanks &mdash; an NRIVA admin will review this report.
                </p>
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Close</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={bodyStyle}>
                  <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px' }}>
                    Reporting <strong>{internshipTitle || internshipId}</strong>
                    {company ? <> at <strong>{company}</strong></> : null}.
                  </p>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Reason</label>
                    <select className="form-control" value={reason} onChange={(e) => setReason(e.target.value)}>
                      {REPORT_REASONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                      What did you see? (optional)
                    </label>
                    <textarea className="form-control" value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Be specific so an admin can investigate."
                      style={{ minHeight: 90 }} maxLength={2000} />
                  </div>
                  {result && result.startsWith('error') && (
                    <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 0' }}>{result}</p>
                  )}
                </div>
                <div style={footerStyle}>
                  <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
}
const modalStyle = {
  background: 'white', borderRadius: 12, width: '100%', maxWidth: 480,
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
}
const headerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
}
const bodyStyle = { padding: '18px 20px' }
const footerStyle = {
  display: 'flex', justifyContent: 'flex-end', gap: 10,
  padding: '12px 20px', borderTop: '1px solid #e2e8f0',
}

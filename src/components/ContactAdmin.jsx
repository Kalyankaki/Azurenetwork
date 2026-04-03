import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createMessage } from '../services/firestore'
import Toast from './Toast'

export default function ContactAdmin() {
  const { user, activeRole } = useAuth()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '', category: 'general' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) {
      setToast('Please fill in all fields')
      return
    }
    setSending(true)
    try {
      await createMessage({
        senderUid: user.uid,
        senderName: user.displayName || user.email,
        senderEmail: user.email,
        senderRole: activeRole,
        subject: form.subject.trim(),
        message: form.message.trim(),
        category: form.category,
      })
      setToast('Message sent to NRIVA administrators!')
      setForm({ subject: '', message: '', category: 'general' })
      setTimeout(() => setOpen(false), 1500)
    } catch (err) {
      setToast('Error: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a237e, #283593)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(26,35,126,0.4)',
          fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Contact Admin"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>Contact NRIVA Admin</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="general">General Question</option>
                    <option value="issue">Report an Issue</option>
                    <option value="feedback">Feedback</option>
                    <option value="access">Access Request</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject <span className="required">*</span></label>
                  <input className="form-control" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required
                    placeholder="Brief description of your message" />
                </div>
                <div className="form-group">
                  <label>Message <span className="required">*</span></label>
                  <textarea className="form-control" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required
                    placeholder="Describe your question, issue, or feedback in detail..."
                    style={{ minHeight: 120 }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </>
  )
}

export default function AIConsentModal({ open, onAccept, onDecline }) {
  if (!open) return null
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="ai-consent-title"
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 14, maxWidth: 520, width: '100%', padding: '24px 26px', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
        <h2 id="ai-consent-title" style={{ fontSize: 18, fontWeight: 700, color: '#1a237e', marginBottom: 8 }}>
          Heads-up about AI features
        </h2>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.55, marginBottom: 12 }}>
          To answer your question or generate content, this site sends your message and small parts of your profile
          (skills, grade level, school, available internships) to <strong>Anthropic</strong>, our third-party AI provider.
        </p>
        <ul style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 12, paddingLeft: 18 }}>
          <li>Your full name, email, date of birth, and resume are <strong>not</strong> sent.</li>
          <li>Anthropic processes your message under their data-handling terms; NRIVA does not use it for advertising.</li>
          <li>You can use the rest of the portal without AI &mdash; AI is optional.</li>
          <li>If you&apos;re under 18, please make sure a parent or guardian is comfortable with this.</li>
        </ul>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          Your choice is saved to your account. You can revoke it any time by contacting an admin.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onDecline}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Not now
          </button>
          <button type="button" onClick={onAccept}
            style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#1a237e', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            I understand &mdash; continue
          </button>
        </div>
      </div>
    </div>
  )
}

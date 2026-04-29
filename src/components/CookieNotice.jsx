import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'nriva_cookie_notice_v1'

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Tiny defer so it doesn't compete with first paint
        const t = setTimeout(() => setVisible(true), 800)
        return () => clearTimeout(t)
      }
    } catch { /* localStorage may be blocked; stay hidden */ }
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()) } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div role="dialog" aria-label="Cookie notice"
      style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 250,
        maxWidth: 640, margin: '0 auto',
        background: 'white', borderRadius: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
      <div style={{ flex: '1 1 280px', fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
        We use cookies and browser storage to keep you signed in and remember your role choice. We
        don&apos;t use advertising cookies. See our{' '}
        <Link to="/privacy" style={{ color: '#1a237e', fontWeight: 600 }}>Privacy Notice</Link>.
      </div>
      <button type="button" onClick={dismiss}
        style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: '#1a237e', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
        Got it
      </button>
    </div>
  )
}

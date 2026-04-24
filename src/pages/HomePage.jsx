import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function HomePage() {
  const { isAuthenticated, activeRole, availableRoles, loginWithGoogle, loginWithEmail, signUp, requestPasswordReset, loading } = useAuth()
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [loggingIn, setLoggingIn] = useState(false)
  const [stats, setStats] = useState({ students: 0, internships: 0, companies: 0 })
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'reset'
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })

  useEffect(() => {
    if (isAuthenticated) return
    let cancelled = false
    async function fetchStats() {
      try {
        // Use server API for public stats (no auth required)
        const res = await fetch('/api/public-stats')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setStats(data)
          return
        }
      } catch { /* fallback below */ }
      // Fallback: try direct Firestore (only works if signed in)
      try {
        const internSnap = await getDocs(collection(db, 'internships'))
        if (cancelled) return
        let openInternships = 0
        const companies = new Set()
        internSnap.forEach(doc => {
          const d = doc.data()
          if (d.status === 'open') openInternships++
          if (d.company) companies.add(d.company)
        })
        setStats(s => ({ ...s, internships: openInternships, companies: companies.size }))
      } catch { /* non-critical */ }
    }
    fetchStats()
    return () => { cancelled = true }
  }, [isAuthenticated])

  if (isAuthenticated && activeRole) return <Navigate to={`/${activeRole}`} replace />
  if (isAuthenticated && availableRoles.length > 0) return <Navigate to="/select-role" replace />
  if (isAuthenticated && !loading) return <Navigate to="/select-role" replace />

  const handleGoogle = async () => {
    setLoggingIn(true); setError(null); setInfo(null)
    const result = await loginWithGoogle()
    if (result.error) { setError(result.error); setLoggingIn(false) }
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    setLoggingIn(true); setError(null); setInfo(null)
    let result
    if (mode === 'signin') result = await loginWithEmail(form.email, form.password)
    else if (mode === 'signup') result = await signUp(form.email, form.password, form.displayName)
    else { // reset
      const r = await requestPasswordReset(form.email)
      setLoggingIn(false)
      if (r.error) setError(r.error)
      else setInfo('Password reset email sent. Check your inbox.')
      return
    }
    if (result?.error) { setError(result.error); setLoggingIn(false) }
  }

  const toggleMode = (newMode) => {
    setMode(newMode); setError(null); setInfo(null)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Pre-launch banner */}
      <div style={{
        background: 'linear-gradient(90deg, #ff6f00 0%, #ffa040 100%)',
        color: 'white', textAlign: 'center', padding: '10px 16px',
        fontSize: 13, fontWeight: 600,
      }}>
        🚀 Pre-Launch — The NRIVA Internship Portal officially kicks off April 29th! Submissions from employers and students are welcome.
      </div>

      {/* Top brand bar */}
      <div style={{
        background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '10px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/NRIVAYouthLogo.jpg" alt="NRIVA"
            style={{ width: 28, height: 28, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none' }} />
          <span style={{ color: 'white', fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>
            NRI Vasavi Association &middot; Internship Program
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
          <a href="https://nriva.org" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>nriva.org</a>
          <a href="https://nriva.org/donate/" target="_blank" rel="noopener noreferrer"
            style={{
              color: '#1a237e', background: '#ffa040', padding: '6px 12px',
              borderRadius: 6, fontWeight: 600, textDecoration: 'none',
            }}>Donate</a>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', textAlign: 'center',
      }}>
        <img src="/NRIVAYouthLogo.jpg" alt="NRIVA"
          style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 20, borderRadius: '50%' }}
          onError={(e) => { e.target.style.display = 'none' }} />

        <h1 style={{
          color: 'white', fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: 800, lineHeight: 1.15, marginBottom: 16, maxWidth: 600,
        }}>
          Your next internship<br />
          <span style={{ color: '#ffa040' }}>starts here.</span>
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.65)', fontSize: 17, lineHeight: 1.6,
          maxWidth: 440, margin: '0 auto 20px',
        }}>
          Real experience. Real mentors. Real impact.<br />
          Built by the NRIVA Youth Committee for students like you.
        </p>

        <div style={{
          display: 'inline-block', background: 'rgba(255,160,64,0.15)',
          border: '1px solid rgba(255,160,64,0.3)', borderRadius: 20,
          padding: '6px 18px', fontSize: 13, color: '#ffa040',
          fontWeight: 500, marginBottom: 28,
        }}>
          Open to students in 10th grade through college
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 16, padding: '28px 32px', maxWidth: 400, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', marginBottom: 24,
        }}>
          <button onClick={handleGoogle} disabled={loggingIn}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              padding: '12px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
              background: 'white', cursor: loggingIn ? 'wait' : 'pointer',
              fontSize: 15, fontWeight: 500, color: '#1a1a2e',
              opacity: loggingIn ? 0.6 : 1, width: '100%', marginBottom: 14,
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loggingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 14px' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          <form onSubmit={handleEmail} style={{ textAlign: 'left' }}>
            {mode === 'signup' && (
              <input type="text" placeholder="Full name" autoComplete="name" value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                style={emailInputStyle} required />
            )}
            <input type="email" placeholder="Email" autoComplete="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={emailInputStyle} required />
            {mode !== 'reset' && (
              <input type="password" placeholder="Password" autoComplete="current-password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={emailInputStyle} required minLength={6} />
            )}
            <button type="submit" disabled={loggingIn}
              style={{
                width: '100%', padding: '12px 20px', borderRadius: 10,
                border: 'none', background: '#1a237e', color: 'white',
                fontSize: 14, fontWeight: 600, cursor: loggingIn ? 'wait' : 'pointer',
                opacity: loggingIn ? 0.6 : 1, marginTop: 4,
              }}>
              {loggingIn ? 'Please wait...' :
                mode === 'signin' ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                'Send Reset Email'}
            </button>
          </form>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            {mode === 'signin' && (
              <>
                <button type="button" onClick={() => toggleMode('reset')}
                  style={linkBtnStyle}>Forgot password?</button>
                <button type="button" onClick={() => toggleMode('signup')}
                  style={linkBtnStyle}>Create account</button>
              </>
            )}
            {mode === 'signup' && (
              <>
                <span />
                <button type="button" onClick={() => toggleMode('signin')}
                  style={linkBtnStyle}>Have an account? Sign in</button>
              </>
            )}
            {mode === 'reset' && (
              <>
                <span />
                <button type="button" onClick={() => toggleMode('signin')}
                  style={linkBtnStyle}>Back to sign in</button>
              </>
            )}
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, color: '#dc2626', fontSize: 12, marginTop: 12,
            }}>
              {error.includes('REPLACE_WITH')
                ? 'Firebase not configured yet. Please set up Firebase credentials.'
                : error}
            </div>
          )}
          {info && (
            <div style={{
              padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 8, color: '#15803d', fontSize: 12, marginTop: 12,
            }}>
              {info}
            </div>
          )}
        </div>

      </div>

      <div style={{
        maxWidth: 1000, margin: '0 auto', padding: '0 20px 40px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16, width: '100%',
      }}>
        {[
          { icon: '🎓', title: 'For Students', desc: 'Browse internships, apply online, and track your application status. Open to 10th grade through college.' },
          { icon: '🏢', title: 'For Employers', desc: 'Post opportunities, review applicants, and manage your hiring pipeline with AI-powered tools.' },
          { icon: '⚙️', title: 'For Admins', desc: 'Oversee the program, manage users, assign coordinators, and view analytics.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 12,
            padding: '20px 24px', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <h3 style={{ color: '#ffa040', fontSize: 15, fontWeight: 600, margin: '8px 0 6px' }}>{title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      <footer style={{
        background: '#0d1642', borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '40px 20px 24px', color: 'rgba(255,255,255,0.7)',
      }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 32, marginBottom: 32,
        }}>
          <div>
            <h4 style={{ color: '#ffa040', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>About NRIVA</h4>
            <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>501(c)(3) Non-Profit Organization</p>
            <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>Tax ID: 26-1923816</p>
            <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>Connecting to Serve &middot; Transforming Lives</p>
            <p style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.6 }}>
              Connecting Vasavites globally to serve humanity through education, health, and cultural preservation.
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.6, marginTop: 8 }}>
              Dharmam (righteousness) &middot; Seelam (integrity) &middot; Ahimsa (non-violence)
            </p>
          </div>
          <div>
            <h4 style={{ color: '#ffa040', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Quick Links</h4>
            {[
              { label: 'About Us', href: 'https://nriva.org/about-us/' },
              { label: 'All Services', href: 'https://nriva.org/services/' },
              { label: 'Donate', href: 'https://nriva.org/donate/' },
              { label: 'FAQ / Help', href: 'https://nriva.org/faq/' },
              { label: 'Membership', href: 'https://nriva.org/membership/' },
              { label: 'Privacy Policy', href: 'https://nriva.org/privacy-policy/' },
            ].map(link => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, textDecoration: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffa040'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                {link.label}
              </a>
            ))}
          </div>
          <div>
            <h4 style={{ color: '#ffa040', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Contact Us</h4>
            <p style={{ fontSize: 13, marginBottom: 8 }}>1-855-WE-NRIVA</p>
            <p style={{ fontSize: 13, marginBottom: 8 }}><a href="mailto:info@nriva.org" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>info@nriva.org</a></p>
            <p style={{ fontSize: 13, marginBottom: 16 }}><a href="https://nriva.org" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>nriva.org</a></p>
          </div>
        </div>
        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, fontSize: 11, opacity: 0.5 }}>
          &copy; {new Date().getFullYear()} NRI Vasavi Association (NRIVA). All rights reserved.
        </div>
      </footer>
    </div>
  )
}

const emailInputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 8,
  background: 'white', color: '#1a1a2e', boxSizing: 'border-box',
}

const linkBtnStyle = {
  background: 'none', border: 'none', color: '#1a237e',
  fontWeight: 500, cursor: 'pointer', padding: 0, fontSize: 12,
}

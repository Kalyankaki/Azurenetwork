import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const { isAuthenticated, activeRole, availableRoles, loginWithGoogle, loginAsDemo, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loggingIn, setLoggingIn] = useState(false)

  // If authenticated with a role, redirect to dashboard
  if (isAuthenticated && activeRole) {
    return <Navigate to={`/${activeRole}`} replace />
  }
  if (isAuthenticated && availableRoles.length > 0) {
    return <Navigate to="/select-role" replace />
  }

  const handleGoogle = async () => {
    setLoggingIn(true)
    setError(null)
    const result = await loginWithGoogle()
    if (result.error) {
      setError(result.error)
      setLoggingIn(false)
    }
  }

  const handleDemo = (role) => {
    loginAsDemo(role)
    navigate(`/${role}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Hero Section - Centered */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <img
          src="/nriva-logo.svg"
          alt="NRIVA - NRI Vasavi Association"
          style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 24 }}
          onError={(e) => { e.target.style.display = 'none' }}
        />

        {/* Hero Text */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,111,0,0.2)',
          color: '#ffa040',
          padding: '6px 16px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 20,
        }}>
          NRI Vasavi Association, USA
        </div>

        <h1 style={{
          color: 'white',
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: 12,
          maxWidth: 700,
        }}>
          Welcome to the New and Improved<br />
          <span style={{ color: '#ffa040' }}>2026 NRIVA Internship Program</span>
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 16,
          lineHeight: 1.6,
          maxWidth: 500,
          margin: '0 auto 32px',
        }}>
          Connecting talent with opportunity. Browse internships, post positions,
          and manage the program — all in one place.
        </p>

        {/* Auth Card - Centered */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          padding: '28px 32px',
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          marginBottom: 24,
        }}>
          {/* Google Sign In */}
          <button
            onClick={handleGoogle}
            disabled={loggingIn || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '14px 20px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              background: 'white',
              cursor: loggingIn ? 'wait' : 'pointer',
              fontSize: 15,
              fontWeight: 500,
              color: '#1a1a2e',
              transition: 'all 0.2s',
              opacity: loggingIn ? 0.6 : 1,
              width: '100%',
              marginBottom: 16,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loggingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              fontSize: 12,
              marginBottom: 12,
            }}>
              {error.includes('REPLACE_WITH')
                ? 'Firebase not configured. Use Demo Mode below.'
                : error}
            </div>
          )}

          {/* Demo Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>OR TRY THE DEMO</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* Demo Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { role: 'intern', color: '#1a237e', label: 'Intern' },
              { role: 'employer', color: '#1b5e20', label: 'Employer' },
              { role: 'admin', color: '#b71c1c', label: 'Admin' },
            ].map(({ role, color, label }) => (
              <button
                key={role}
                onClick={() => handleDemo(role)}
                style={{
                  flex: 1,
                  padding: '9px 6px',
                  borderRadius: 8,
                  border: `2px solid ${color}`,
                  background: 'transparent',
                  color: color,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = color }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          {[
            { value: '50+', label: 'Active Positions' },
            { value: '200+', label: 'Applications' },
            { value: '30+', label: 'Partner Companies' },
          ].map(({ value, label }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.08)',
              padding: '12px 20px',
              borderRadius: 10,
              color: 'white',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '0 20px 40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        width: '100%',
      }}>
        {[
          { icon: '🎓', title: 'For Interns', desc: 'Browse internships, apply online, and track your application status in real-time.', color: '#1a237e' },
          { icon: '🏢', title: 'For Employers', desc: 'Post opportunities, review applicants, and manage your hiring pipeline.', color: '#1b5e20' },
          { icon: '⚙️', title: 'For Admins', desc: 'Oversee the program, manage users, and view comprehensive analytics.', color: '#b71c1c' },
        ].map(({ icon, title, desc, color }) => (
          <div key={title} style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '20px 24px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <h3 style={{ color: '#ffa040', fontSize: 15, fontWeight: 600, margin: '8px 0 6px' }}>{title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
      }}>
        <p>NRI Vasavi Association (NRIVA) &middot; 501(c)(3) Non-Profit &middot; Tax-ID: 26-1923816</p>
        <p style={{ marginTop: 4 }}>Connecting to Serve</p>
      </footer>
    </div>
  )
}

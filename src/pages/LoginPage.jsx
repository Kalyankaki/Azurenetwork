import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { loginWithGoogle, loginWithLinkedIn, loginAsDemo, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loggingIn, setLoggingIn] = useState(false)

  const handleGoogle = async () => {
    setLoggingIn(true)
    setError(null)
    const result = await loginWithGoogle()
    if (result.error) {
      setError(result.error)
      setLoggingIn(false)
    } else {
      navigate('/select-role')
    }
  }

  const handleLinkedIn = async () => {
    setLoggingIn(true)
    setError(null)
    const result = await loginWithLinkedIn()
    if (result.error) {
      setError(result.error)
      setLoggingIn(false)
    } else {
      navigate('/select-role')
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '40px 36px',
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="/nriva-logo.svg"
            alt="NRIVA - NRI Vasavi Association"
            style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 12 }}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div style={{
            display: 'none',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a237e, #ff6f00)',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'white',
            fontWeight: 800,
            fontSize: 24,
          }}>
            NV
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a237e', marginBottom: 4 }}>
            NRIVA Internship Portal
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            NRI Vasavi Association, USA
          </p>
          <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
            501(c)(3) Non-Profit Organization
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <button
            onClick={handleGoogle}
            disabled={loggingIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '12px 20px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              background: 'white',
              cursor: loggingIn ? 'wait' : 'pointer',
              fontSize: 15,
              fontWeight: 500,
              color: '#1a1a2e',
              transition: 'all 0.2s',
              opacity: loggingIn ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!loggingIn) e.currentTarget.style.background = '#f8fafc' }}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={handleLinkedIn}
            disabled={loggingIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#0A66C2',
              cursor: loggingIn ? 'wait' : 'pointer',
              fontSize: 15,
              fontWeight: 500,
              color: 'white',
              transition: 'all 0.2s',
              opacity: loggingIn ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!loggingIn) e.currentTarget.style.background = '#004182' }}
            onMouseLeave={(e) => e.currentTarget.style.background = '#0A66C2'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Sign in with LinkedIn
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 13,
            marginBottom: 16,
          }}>
            {error.includes('REPLACE_WITH') ?
              'Firebase is not configured yet. Use Demo Mode below, or set up Firebase credentials.' :
              error
            }
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '4px 0 20px',
        }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>OR TRY THE DEMO</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleDemo('intern')}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 8,
              border: '2px solid #1a237e',
              background: 'transparent',
              color: '#1a237e',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a237e'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1a237e' }}
          >
            Intern Demo
          </button>
          <button
            onClick={() => handleDemo('employer')}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 8,
              border: '2px solid #1b5e20',
              background: 'transparent',
              color: '#1b5e20',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1b5e20'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1b5e20' }}
          >
            Employer Demo
          </button>
          <button
            onClick={() => handleDemo('admin')}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 8,
              border: '2px solid #b71c1c',
              background: 'transparent',
              color: '#b71c1c',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#b71c1c'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b71c1c' }}
          >
            Admin Demo
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16 }}>
          NRIVA Internship Program 2026 &middot; Connecting to Serve
        </p>
      </div>
    </div>
  )
}

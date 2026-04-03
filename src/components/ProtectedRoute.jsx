import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, availableRoles, activeRole, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--nriva-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid #e2e8f0',
            borderTopColor: '#1a237e',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (availableRoles.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)',
        padding: 20,
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '48px 36px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a237e', marginBottom: 12 }}>
            Account Pending Approval
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Your account has been created but no roles have been assigned yet.
            An NRIVA administrator will review your account and grant access shortly.
          </p>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>
            Contact: admin@nriva.org
          </p>
        </div>
      </div>
    )
  }

  if (allowedRole && !availableRoles.includes(allowedRole)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--nriva-bg)',
        padding: 20,
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '40px 32px',
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#c62828', marginBottom: 12 }}>
            Access Denied
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
            You don't have the <strong>{allowedRole}</strong> role.
            Contact an administrator to request access.
          </p>
          <a href={`/${availableRoles[0] || ''}`} className="btn btn-primary" style={{ display: 'inline-flex' }}>
            Go to My Dashboard
          </a>
        </div>
      </div>
    )
  }

  if (!activeRole) {
    return <Navigate to="/select-role" replace />
  }

  return children
}

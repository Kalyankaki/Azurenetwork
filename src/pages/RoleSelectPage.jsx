import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const roleConfig = [
  {
    id: 'intern',
    title: 'Intern',
    description: 'Browse and apply for internship positions',
    icon: '🎓',
    color: '#1a237e',
  },
  {
    id: 'employer',
    title: 'Employer',
    description: 'Post opportunities and manage applicants',
    icon: '🏢',
    color: '#1b5e20',
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Oversee the entire internship program',
    icon: '⚙️',
    color: '#b71c1c',
  },
]

export default function RoleSelectPage() {
  const { user, availableRoles, selectRole } = useAuth()
  const navigate = useNavigate()

  const visibleRoles = roleConfig.filter(r => availableRoles.includes(r.id))

  // Auto-redirect if only one role
  useEffect(() => {
    if (visibleRoles.length === 1) {
      selectRole(visibleRoles[0].id)
      navigate(`/${visibleRoles[0].id}`, { replace: true })
    }
  }, [visibleRoles.length])

  const handleSelect = (roleId) => {
    selectRole(roleId)
    navigate(`/${roleId}`)
  }

  if (availableRoles.length === 0) {
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
          padding: '48px 36px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a237e', marginBottom: 12 }}>
            Account Pending Approval
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Your account has been created successfully. An NRIVA administrator
            will review your account and assign roles shortly.
          </p>
          <Link to="/" style={{ color: '#1a237e', fontSize: 14, fontWeight: 500 }}>
            Return to Home
          </Link>
        </div>
      </div>
    )
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
      <div style={{ textAlign: 'center', marginBottom: 32, color: 'white' }}>
        <img
          src="/nriva-logo.svg"
          alt="NRIVA"
          style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16 }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Welcome, {user?.displayName || 'User'}!
        </h1>
        <p style={{ opacity: 0.7, fontSize: 15 }}>
          Select your role to continue
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
        {visibleRoles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '32px 28px',
              width: 220,
              border: '2px solid transparent',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)'
              e.currentTarget.style.borderColor = role.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>{role.icon}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: role.color, marginBottom: 8 }}>
              {role.title}
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              {role.description}
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={() => window.history.back()}
        style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 24, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Go back
      </button>
    </div>
  )
}

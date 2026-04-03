import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const roles = [
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
  const { user, selectRole } = useAuth()
  const navigate = useNavigate()

  const handleSelect = (roleId) => {
    selectRole(roleId)
    navigate(`/${roleId}`)
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
        {roles.map((role) => (
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

      <Link to="/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 24 }}>
        Sign out and use a different account
      </Link>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { onboardUser, sendAdminNotification } from '../services/firestore'

const roleConfig = [
  {
    id: 'intern',
    title: 'Intern',
    description: 'Browse and apply for internship positions (10th grade - college)',
    icon: '🎓',
    color: '#1a237e',
    autoApproved: true,
  },
  {
    id: 'employer',
    title: 'Employer',
    description: 'Post internship opportunities and manage applicants',
    icon: '🏢',
    color: '#1b5e20',
    autoApproved: false,
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Oversee the internship program and manage users',
    icon: '⚙️',
    color: '#b71c1c',
    autoApproved: false,
  },
]

export default function RoleSelectPage() {
  const { user, availableRoles, selectRole, logout, refreshRoles } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const visibleRoles = roleConfig.filter(r => availableRoles.includes(r.id))
  const isNewUser = availableRoles.length === 0

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

  // New user onboarding form
  if (isNewUser) {
    return <OnboardingForm user={user} logout={logout} navigate={navigate}
      selectRole={selectRole} refreshRoles={refreshRoles}
      submitting={submitting} setSubmitting={setSubmitting}
      error={error} setError={setError} />
  }

  // Existing user with roles - show role selection
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32, color: 'white' }}>
        <img src="/NRIVAYouthLogo.jpg" alt="NRIVA"
          style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16 }}
          onError={(e) => { e.target.style.display = 'none' }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Welcome, {user?.displayName || 'User'}!
        </h1>
        <p style={{ opacity: 0.7, fontSize: 15 }}>Select your role to continue</p>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
        {visibleRoles.map((role) => (
          <button key={role.id} onClick={() => handleSelect(role.id)}
            style={{
              background: 'white', borderRadius: 16, padding: '32px 28px',
              width: 220, border: '2px solid transparent',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)'; e.currentTarget.style.borderColor = role.color }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{role.icon}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: role.color, marginBottom: 8 }}>{role.title}</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{role.description}</p>
          </button>
        ))}
      </div>

      <button onClick={() => window.history.back()}
        style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
        Go back
      </button>
    </div>
  )
}

function OnboardingForm({ user, logout, navigate, selectRole, refreshRoles, submitting, setSubmitting, error, setError }) {
  const [selectedRole, setSelectedRole] = useState('')
  const [membership, setMembership] = useState('')
  const [displayName, setDisplayName] = useState(user?.displayName || '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRole) { setError('Please select a role'); return }
    if (!displayName.trim()) { setError('Please enter your name'); return }

    setSubmitting(true)
    setError(null)
    try {
      const roles = await onboardUser(user.uid, {
        requestedRole: selectedRole,
        nrivaMembership: membership.trim(),
        displayName: displayName.trim(),
      })

      // Send notification to admin about new signup (email + Firestore)
      const notifyData = {
        userName: displayName.trim(),
        userEmail: user.email,
        requestedRole: selectedRole,
        nrivaMembership: membership.trim() || 'None',
        userUid: user.uid,
      }
      try {
        await sendAdminNotification({ type: 'new_signup', ...notifyData })
        // Also try email via serverless function
        fetch('/api/notify-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifyData),
        }).catch(() => {})
      } catch {
        // Notification is best-effort
      }

      // Refresh auth context to get updated roles
      await refreshRoles()

      if (selectedRole === 'intern') {
        selectRole('intern')
        navigate('/intern', { replace: true })
      } else {
        // Employer/admin need approval - show pending message
        setSubmitting(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.')
      setSubmitting(false)
    }
  }

  const selectedConfig = roleConfig.find(r => r.id === selectedRole)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '36px 32px',
        maxWidth: 520, width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/NRIVAYouthLogo.jpg" alt="NRIVA"
            style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 12 }}
            onError={(e) => { e.target.style.display = 'none' }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a237e', marginBottom: 4 }}>
            Welcome to NRIVA Internship Program!
          </h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Tell us about yourself to get started
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
              Full Name <span style={{ color: '#c62828' }}>*</span>
            </label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name" required
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
              Email
            </label>
            <input type="email" value={user?.email || ''} disabled
              style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
              NRIVA Membership ID
            </label>
            <input type="text" value={membership} onChange={(e) => setMembership(e.target.value)}
              placeholder="e.g., NRIVA-12345 (optional)"
              style={inputStyle} />
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
              Don&apos;t have one? Sign up at{' '}
              <a href="https://nriva.org/membership" target="_blank" rel="noopener noreferrer"
                style={{ color: '#1a237e', fontWeight: 500 }}>
                nriva.org/membership
              </a>
            </p>
            <p style={{ fontSize: 12, color: '#b45309', marginTop: 4, fontStyle: 'italic' }}>
              * Life members will be given priority for internship placements
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: 14, marginBottom: 10 }}>
              I want to join as <span style={{ color: '#c62828' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {roleConfig.filter(r => r.id !== 'admin').map((role) => (
                <button key={role.id} type="button"
                  onClick={() => setSelectedRole(role.id)}
                  style={{
                    flex: 1, minWidth: 140, padding: '16px 12px',
                    borderRadius: 12, textAlign: 'center',
                    border: `2px solid ${selectedRole === role.id ? role.color : '#e2e8f0'}`,
                    background: selectedRole === role.id ? `${role.color}10` : 'white',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{role.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: role.color }}>{role.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    {role.autoApproved ? '✓ Instant access' : 'Requires approval'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedConfig && !selectedConfig.autoApproved && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
              padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 16,
            }}>
              The {selectedConfig.title.toLowerCase()} role requires admin approval. You&apos;ll be notified once approved.
            </div>
          )}

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting || !selectedRole}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 10,
              border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              background: selectedRole ? '#1a237e' : '#e2e8f0',
              color: selectedRole ? 'white' : '#94a3b8',
              opacity: submitting ? 0.6 : 1,
              transition: 'all 0.2s',
            }}>
            {submitting ? 'Setting up your account...' :
              selectedRole === 'intern' ? 'Get Started as Intern' :
              selectedRole ? `Request ${selectedConfig?.title} Access` :
              'Select a role above'}
          </button>

          <button type="button" onClick={async () => { await logout(); navigate('/') }}
            style={{
              width: '100%', marginTop: 12, padding: '10px', border: 'none',
              background: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer',
            }}>
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box',
}

import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const navItems = {
  intern: [
    { path: '/intern', label: 'Dashboard', icon: '📊' },
    { path: '/intern/browse', label: 'Browse Internships', icon: '🔍' },
    { path: '/intern/applications', label: 'My Applications', icon: '📄' },
  ],
  employer: [
    { path: '/employer', label: 'Dashboard', icon: '📊' },
    { path: '/employer/postings', label: 'My Postings', icon: '📋' },
    { path: '/employer/new-posting', label: 'Post New', icon: '➕' },
    { path: '/employer/applicants', label: 'Applicants', icon: '👥' },
  ],
  admin: [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/internships', label: 'Internships', icon: '💼' },
    { path: '/admin/applications', label: 'Applications', icon: '📄' },
    { path: '/admin/reports', label: 'Reports', icon: '📈' },
  ],
}

const roleLabels = {
  intern: 'Intern Portal',
  employer: 'Employer Portal',
  admin: 'Admin Portal',
}

const roleColors = {
  intern: '#1a237e',
  employer: '#1b5e20',
  admin: '#b71c1c',
}

export default function Layout({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 250 : 60,
        background: `linear-gradient(180deg, ${roleColors[role]} 0%, ${roleColors[role]}dd 100%)`,
        color: 'white',
        transition: 'width 0.3s ease',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Logo area */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}>
              NV
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>NRIVA</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{roleLabels[role]}</div>
              </div>
            )}
          </Link>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems[role].map((item) => {
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === `/${role}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  marginBottom: 4,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: 'white',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            margin: 12,
            padding: 8,
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? 250 : 60,
        transition: 'margin-left 0.3s ease',
      }}>
        {/* Top bar */}
        <header style={{
          background: 'white',
          padding: '12px 24px',
          borderBottom: '1px solid var(--nriva-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ fontSize: 13, color: 'var(--nriva-text-light)' }}>
            NRIVA Internship Program 2026
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--nriva-text-light)' }}>
              Demo Mode
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: roleColors[role],
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
            }}>
              {role === 'intern' ? 'IN' : role === 'employer' ? 'EM' : 'AD'}
            </div>
          </div>
        </header>

        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

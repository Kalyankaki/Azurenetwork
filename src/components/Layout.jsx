import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ContactAdmin from './ContactAdmin'
import AIAssistant from './AIAssistant'

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
    { path: '/admin/messages', label: 'Messages', icon: '✉️' },
    { path: '/admin/reports', label: 'Reports', icon: '📈' },
    { path: '/admin/users', label: 'Manage Users', icon: '👤' },
    { path: '/admin/activity', label: 'Activity Log', icon: '📜' },
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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, userCoordinator, availableRoles } = useAuth()
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (window.innerWidth <= 768) setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {sidebarOpen && isMobile && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      <aside style={{
        width: sidebarOpen ? 250 : 60,
        background: `linear-gradient(180deg, ${roleColors[role]} 0%, ${roleColors[role]}dd 100%)`,
        color: 'white', transition: 'all 0.3s ease',
        position: 'fixed', top: 0, left: sidebarOpen || !isMobile ? 0 : -60, bottom: 0,
        zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/NRIVAYouthLogo.jpg" alt="NRIVA"
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', flexShrink: 0, background: 'rgba(255,255,255,0.9)', padding: 2 }}
              onError={(e) => { e.target.outerHTML = '<div style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;color:white">NV</div>' }}
            />
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>NRIVA</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{roleLabels[role]}</div>
              </div>
            )}
          </Link>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems[role].map((item) => {
            const isActive = location.pathname === item.path
            return (
              <NavLink key={item.path} to={item.path} end={item.path === `/${role}`} aria-label={item.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: 'white', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>
                <span style={{ fontSize: 18 }} role="img" aria-hidden="true">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Coordinator info in sidebar */}
        {sidebarOpen && userCoordinator && role !== 'admin' && (
          <div style={{
            margin: '0 12px 8px', padding: '10px 12px',
            background: 'rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12,
          }}>
            <div style={{ opacity: 0.7, marginBottom: 4 }}>NRIVA Coordinator</div>
            <div style={{ fontWeight: 600 }}>{userCoordinator.name}</div>
            {userCoordinator.email && (
              <div style={{ opacity: 0.7, fontSize: 11 }}>{userCoordinator.email}</div>
            )}
          </div>
        )}

        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={sidebarOpen}
          style={{
            margin: 12, padding: 8, background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: 8, color: 'white', fontSize: 16, cursor: 'pointer',
          }}>
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      <main style={{
        flex: 1, marginLeft: isMobile ? 0 : (sidebarOpen ? 250 : 60),
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh', overflow: 'auto',
      }}>
        <header style={{
          background: 'white', padding: '12px 24px',
          borderBottom: '1px solid var(--nriva-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} aria-label="Open menu"
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4 }}>☰</button>
            )}
            <span style={{ fontSize: 13, color: 'var(--nriva-text-light)' }}>
              NRIVA Internship Program 2026
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            {availableRoles.length > 1 && (
              <button onClick={() => navigate('/select-role')} className="btn btn-sm btn-outline"
                style={{ fontSize: 12, padding: '4px 10px' }}>Switch Role</button>
            )}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowUserMenu(!showUserMenu)}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              ) : (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: roleColors[role],
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600,
                }}>
                  {(user?.displayName || 'U')[0].toUpperCase()}
                </div>
              )}
              {showUserMenu && (
                <div style={{
                  position: 'absolute', top: 40, right: 0, background: 'white',
                  borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  padding: '8px 0', minWidth: 180, zIndex: 200,
                }}>
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--nriva-border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.displayName || 'User'}</div>
                    <div style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>{user?.email}</div>
                  </div>
                  <button
                    onClick={async () => { await logout(); navigate('/') }}
                    style={{
                      display: 'block', width: '100%', padding: '8px 16px',
                      border: 'none', background: 'none', textAlign: 'left',
                      fontSize: 13, color: 'var(--nriva-danger)', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={{ padding: isMobile ? 16 : 24 }}>
          <Outlet />
        </div>
      </main>

      {/* Contact Admin button for non-admin roles */}
      <AIAssistant />
      {role !== 'admin' && <ContactAdmin />}
    </div>
  )
}

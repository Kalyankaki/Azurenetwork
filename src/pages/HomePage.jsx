import { Link } from 'react-router-dom'

const roles = [
  {
    title: 'Intern Portal',
    description: 'Browse available internships, apply to positions, and track your application status.',
    path: '/intern',
    icon: '🎓',
    color: '#1a237e',
    features: ['Browse internship listings', 'Submit applications online', 'Track application status', 'View position details'],
  },
  {
    title: 'Employer Portal',
    description: 'Post internship opportunities, review applicants, and manage your job listings.',
    path: '/employer',
    icon: '🏢',
    color: '#1b5e20',
    features: ['Post new internship positions', 'Review applications', 'Manage job requirements', 'Track applicant pipeline'],
  },
  {
    title: 'Admin Portal',
    description: 'Oversee the entire internship program, manage positions, and monitor progress.',
    path: '/admin',
    icon: '⚙️',
    color: '#b71c1c',
    features: ['Monitor all internships', 'Manage applications', 'View analytics & reports', 'Facilitate matching'],
  },
]

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)' }}>
      <header style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: 16,
          }}>
            NV
          </div>
          <div>
            <div style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>NRIVA</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>NRI Vasavi Association</div>
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
          Internship Management Portal
        </div>
      </header>

      <section style={{
        textAlign: 'center',
        padding: '60px 20px 40px',
        maxWidth: 800,
        margin: '0 auto',
      }}>
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
          2026 Internship Program
        </div>
        <h1 style={{
          color: 'white',
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: 16,
        }}>
          Connecting Talent with<br />
          <span style={{ color: '#ffa040' }}>Opportunity</span>
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 18,
          lineHeight: 1.7,
          maxWidth: 600,
          margin: '0 auto 40px',
        }}>
          NRIVA&apos;s Internship Program bridges the gap between aspiring professionals
          and organizations, creating pathways for growth and community impact.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '14px 24px',
            borderRadius: 12,
            color: 'white',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>50+</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Active Positions</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '14px 24px',
            borderRadius: 12,
            color: 'white',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>200+</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Applications</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '14px 24px',
            borderRadius: 12,
            color: 'white',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>30+</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Partner Companies</div>
          </div>
        </div>
      </section>

      <section style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '40px 20px 80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
      }}>
        {roles.map((role) => (
          <Link key={role.path} to={role.path} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 32,
              transition: 'all 0.3s ease',
              height: '100%',
              cursor: 'pointer',
              border: '2px solid transparent',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)'
              e.currentTarget.style.borderColor = role.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'transparent'
            }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: `${role.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                marginBottom: 20,
              }}>
                {role.icon}
              </div>
              <h3 style={{
                fontSize: 22,
                fontWeight: 700,
                color: role.color,
                marginBottom: 10,
              }}>
                {role.title}
              </h3>
              <p style={{
                color: '#64748b',
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 20,
              }}>
                {role.description}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                {role.features.map((f, i) => (
                  <li key={i} style={{
                    padding: '6px 0',
                    fontSize: 13,
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{ color: role.color, fontWeight: 700 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: role.color,
                fontWeight: 600,
                fontSize: 14,
              }}>
                Enter Portal →
              </div>
            </div>
          </Link>
        ))}
      </section>

      <footer style={{
        textAlign: 'center',
        padding: '24px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
      }}>
        <p>NRI Vasavi Association (NRIVA) - Internship Program</p>
        <p style={{ marginTop: 4 }}>This is a demo prototype for presentation purposes.</p>
      </footer>
    </div>
  )
}

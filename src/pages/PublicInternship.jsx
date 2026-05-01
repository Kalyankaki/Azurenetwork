import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getInternship } from '../services/firestore'

const STIPEND_LABELS = { paid: 'Paid', unpaid: 'Volunteer / Unpaid' }
const TYPE_LABELS = { remote: 'Remote', 'in-person': 'In-person', hybrid: 'Hybrid' }

function formatDeadline(value) {
  if (!value) return null
  let d
  if (typeof value === 'string') d = new Date(value)
  else if (value?.seconds) d = new Date(value.seconds * 1000)
  else if (value?.toDate) d = value.toDate()
  else return null
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PublicInternship() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, availableRoles } = useAuth()
  const [state, setState] = useState({ loading: true, internship: null, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ loading: true, internship: null, error: null })
    getInternship(id)
      .then(internship => {
        if (cancelled) return
        setState({ loading: false, internship, error: null })
      })
      .catch(err => {
        if (cancelled) return
        setState({ loading: false, internship: null, error: err?.message || 'Failed to load internship' })
      })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    const i = state.internship
    if (i?.title && i?.company) {
      const prev = document.title
      document.title = `${i.title} · ${i.company} · NRIVA Internship`
      return () => { document.title = prev }
    }
  }, [state.internship])

  const onApply = () => {
    if (isAuthenticated && (availableRoles || []).includes('intern')) {
      navigate(`/intern/apply/${id}`)
    } else {
      navigate('/login')
    }
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <Link to="/" style={brandLinkStyle}>
          <img src="/NRIVAYouthLogo.jpg" alt="NRIVA" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>NRIVA Internship Program</span>
        </Link>
        <Link to="/login" style={signInLinkStyle}>Sign in</Link>
      </header>

      <main style={mainStyle}>
        {state.loading && (
          <div style={cardStyle}><p style={{ color: '#64748b', fontSize: 14 }}>Loading…</p></div>
        )}

        {!state.loading && (!state.internship || state.error) && (
          <div style={cardStyle}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔎</div>
            <h1 style={titleStyle}>Internship not available</h1>
            <p style={subtitleStyle}>
              This internship link is no longer active. The posting may have been closed, removed, or the link may be incorrect.
            </p>
            <div style={{ marginTop: 16 }}>
              <Link to="/" style={primaryBtnStyle}>Browse the program</Link>
            </div>
          </div>
        )}

        {!state.loading && state.internship && state.internship.status !== 'open' && (
          <div style={cardStyle}>
            <h1 style={titleStyle}>{state.internship.title}</h1>
            <p style={subtitleStyle}>
              {state.internship.company}{state.internship.location ? ` · ${state.internship.location}` : ''}
            </p>
            <div style={noticeStyle}>
              <strong>This posting is no longer accepting applications.</strong>
              <span style={{ display: 'block', marginTop: 4, color: '#64748b', fontSize: 13 }}>
                Other openings are listed on the NRIVA Internship Program home page.
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link to="/" style={primaryBtnStyle}>See open internships</Link>
            </div>
          </div>
        )}

        {!state.loading && state.internship && state.internship.status === 'open' && (
          <Internship i={state.internship} onApply={onApply} isAuthenticated={isAuthenticated} availableRoles={availableRoles || []} />
        )}
      </main>

      <footer style={footerStyle}>
        <Link to="/privacy" style={footerLinkStyle}>Privacy</Link>
        <Link to="/terms" style={footerLinkStyle}>Terms</Link>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>© NRIVA Internship Program</span>
      </footer>
    </div>
  )
}

function Internship({ i, onApply, isAuthenticated, availableRoles }) {
  const facts = [
    i.type && { label: 'Type', value: TYPE_LABELS[i.type] || i.type },
    i.duration && { label: 'Duration', value: i.duration },
    i.stipend && { label: 'Compensation', value: STIPEND_LABELS[i.stipend] || i.stipend },
    i.expectedHoursPerDay && { label: 'Hours / day', value: i.expectedHoursPerDay },
    (i.positions || i.positions === 0) && { label: 'Positions', value: i.positions || 1 },
    i.gradeLevelMin && {
      label: 'Grade level',
      value: i.gradeLevelMax ? `${i.gradeLevelMin} – ${i.gradeLevelMax}` : `${i.gradeLevelMin}+`,
    },
    formatDeadline(i.deadline) && { label: 'Apply by', value: formatDeadline(i.deadline) },
  ].filter(Boolean)

  const nonInternMember = isAuthenticated && !availableRoles.includes('intern')

  return (
    <article style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={titleStyle}>{i.title}</h1>
        <span style={badgeOpenStyle}>Open</span>
      </div>
      <p style={subtitleStyle}>
        <strong>{i.company}</strong>{i.location ? ` · ${i.location}` : ''}
      </p>

      {facts.length > 0 && (
        <dl style={factsGridStyle}>
          {facts.map(f => (
            <div key={f.label} style={factItemStyle}>
              <dt style={factLabelStyle}>{f.label}</dt>
              <dd style={factValueStyle}>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {i.description && (
        <section style={{ marginTop: 24 }}>
          <h2 style={sectionTitleStyle}>About this internship</h2>
          <p style={descriptionStyle}>{i.description}</p>
        </section>
      )}

      {(i.skills || []).length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h2 style={sectionTitleStyle}>Skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {i.skills.map(s => (
              <span key={s} style={chipStyle}>{s}</span>
            ))}
          </div>
        </section>
      )}

      <div style={ctaRowStyle}>
        <button type="button" onClick={onApply} style={primaryBtnStyle}>
          {isAuthenticated && availableRoles.includes('intern') ? 'Apply now' : 'Sign in to apply'}
        </button>
        {nonInternMember && (
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            Your account doesn&apos;t have an intern role. Contact an NRIVA admin if you need access.
          </p>
        )}
        {!isAuthenticated && (
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            New here? You&apos;ll be able to sign up after the next screen.
          </p>
        )}
      </div>
    </article>
  )
}

const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)',
  color: '#0f172a',
  display: 'flex',
  flexDirection: 'column',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  color: 'white',
}

const brandLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  color: 'white',
  textDecoration: 'none',
}

const signInLinkStyle = {
  background: 'rgba(255,255,255,0.12)',
  color: 'white',
  textDecoration: 'none',
  padding: '8px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
}

const mainStyle = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  padding: '24px 16px 40px',
}

const cardStyle = {
  background: 'white',
  borderRadius: 20,
  padding: '32px 28px',
  maxWidth: 720,
  width: '100%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
}

const titleStyle = {
  fontSize: 26,
  fontWeight: 700,
  color: '#1a237e',
  margin: 0,
  lineHeight: 1.25,
}

const subtitleStyle = {
  marginTop: 6,
  marginBottom: 0,
  color: '#475569',
  fontSize: 15,
}

const noticeStyle = {
  marginTop: 18,
  background: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#9a3412',
  fontSize: 14,
}

const factsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
  margin: '20px 0 0',
  padding: '16px 0 0',
  borderTop: '1px solid #e2e8f0',
}

const factItemStyle = { margin: 0 }
const factLabelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  margin: 0,
}
const factValueStyle = { fontSize: 14, fontWeight: 500, color: '#0f172a', margin: '2px 0 0' }

const sectionTitleStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: '#1a237e',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  margin: 0,
}

const descriptionStyle = {
  marginTop: 8,
  marginBottom: 0,
  fontSize: 14,
  color: '#334155',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
}

const chipStyle = {
  background: '#e8eaf6',
  color: '#1a237e',
  fontSize: 12,
  fontWeight: 500,
  padding: '4px 12px',
  borderRadius: 999,
}

const ctaRowStyle = {
  marginTop: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  alignItems: 'flex-start',
}

const primaryBtnStyle = {
  background: '#ffa040',
  color: '#1a237e',
  border: 'none',
  padding: '12px 24px',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
}

const badgeOpenStyle = {
  background: '#dcfce7',
  color: '#15803d',
  fontSize: 12,
  fontWeight: 700,
  padding: '4px 10px',
  borderRadius: 999,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const footerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: 18,
  padding: '20px 16px',
  fontSize: 12,
  color: 'rgba(255,255,255,0.7)',
}

const footerLinkStyle = { color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }

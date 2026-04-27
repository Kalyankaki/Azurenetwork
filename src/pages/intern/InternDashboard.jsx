import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships, useApplications } from '../../hooks/useFirestore'
import { MAX_INTERN_APPLICATIONS, getUser } from '../../services/firestore'
import { formatDate } from '../../utils/date'
import { statusBadgeClass, statusDisplay } from '../../utils/status'
import { scoreCandidate, explainMatch } from '../../utils/matching'

function scoreInternshipForIntern(internship, profile) {
  if (!profile) return null
  const fakeApp = {
    profileSkills: profile.skills || [],
    profileInterests: profile.interests || [],
    gradeLevel: profile.gradeLevel || '',
    relevantSkills: '',
    priorExperience: profile.experienceSummary || '',
    hoursPerDay: profile.availability === 'flexible' ? 'Flexible' : '',
    availableFrom: '', availableTo: '',
  }
  return scoreCandidate(fakeApp, internship)
}

export default function InternDashboard() {
  const { user } = useAuth()
  const { data: allApplications } = useApplications({ applicantUid: user?.uid })
  const { data: allInternships } = useInternships()
  const [userProfile, setUserProfile] = useState(null)
  const myApplications = allApplications.slice(0, 3)
  const remainingApps = Math.max(0, MAX_INTERN_APPLICATIONS - allApplications.length)

  useEffect(() => {
    if (user?.uid) {
      getUser(user.uid).then(p => setUserProfile(p)).catch(() => {})
    }
  }, [user?.uid])

  const hasProfile = userProfile?.skills?.length > 0 || userProfile?.interests?.length > 0

  // Smart matching: score and sort internships
  const openInternships = allInternships.filter(i => i.status === 'open')
  const scored = hasProfile
    ? openInternships.map(i => ({ ...i, match: scoreInternshipForIntern(i, userProfile) }))
    : openInternships.map(i => ({ ...i, match: null }))
  const recommended = hasProfile
    ? [...scored].sort((a, b) => (b.match?.overall || 0) - (a.match?.overall || 0)).slice(0, 6)
    : scored.slice(0, 3)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.displayName || 'Student'}!</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            Here&apos;s your internship overview
          </p>
        </div>
        <Link to="/intern/browse" className="btn btn-primary">
          Browse Internships
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Applications</div>
          <div className="stat-value">{allApplications.length} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--nriva-text-light)' }}>/ {MAX_INTERN_APPLICATIONS}</span></div>
          <div style={{ fontSize: 12, color: remainingApps === 0 ? 'var(--nriva-danger)' : 'var(--nriva-text-light)', marginTop: 4 }}>
            {remainingApps === 0 ? 'Maximum reached' : `${remainingApps} remaining`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Under Review</div>
          <div className="stat-value" style={{ color: 'var(--nriva-warning)' }}>{allApplications.filter(a => a.status === 'under_review').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Shortlisted</div>
          <div className="stat-value" style={{ color: 'var(--nriva-success)' }}>{allApplications.filter(a => a.status === 'shortlisted').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Positions</div>
          <div className="stat-value">{openInternships.length}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>My Recent Applications</h2>
          <Link to="/intern/applications" style={{ color: 'var(--nriva-primary)', fontSize: 14, fontWeight: 500 }}>
            View All →
          </Link>
        </div>
        {myApplications.length === 0 ? (
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>No applications yet. Browse internships to get started!</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Position</th><th>Company</th><th>Applied</th><th>Status</th></tr>
              </thead>
              <tbody>
                {myApplications.map(app => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 500 }}>{app.internshipTitle}</td>
                    <td>{app.company}</td>
                    <td>{formatDate(app.appliedDate)}</td>
                    <td>
                      <span className={`badge badge-${statusBadgeClass(app.status)}`}>
                        {statusDisplay(app.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>
              {hasProfile ? '🎯 Matched for You' : 'Recommended for You'}
            </h2>
            {hasProfile && (
              <p style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginTop: 4 }}>
                {userProfile.skills?.length
                  ? <>Based on your skills: {(userProfile.skills || []).slice(0, 3).join(', ')}{userProfile.skills.length > 3 ? ` +${userProfile.skills.length - 3} more` : ''}</>
                  : 'Based on your interests'}
                {' · '}<Link to="/intern/profile" style={{ color: 'var(--nriva-primary)' }}>Edit profile</Link>
              </p>
            )}
          </div>
          <Link to="/intern/browse" style={{ color: 'var(--nriva-primary)', fontSize: 14, fontWeight: 500 }}>
            Browse All →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {recommended.map(job => {
            const overall = job.match?.overall || 0
            const reasons = job.match ? explainMatch(job.match, job).slice(0, 3) : []
            const badgeColor = overall >= 75 ? '#15803d' : overall >= 50 ? '#ca8a04' : '#64748b'
            const badgeBg = overall >= 75 ? '#dcfce7' : overall >= 50 ? '#fef3c7' : '#f1f5f9'
            const badgeLabel = overall >= 75 ? 'Great match' : overall >= 50 ? 'Good match' : 'Possible match'
            return (
              <div key={job.id} style={{
                border: '1px solid var(--nriva-border)', borderRadius: 'var(--nriva-radius)', padding: 16,
                position: 'relative', display: 'flex', flexDirection: 'column',
              }}>
                {hasProfile && job.match && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: badgeBg, color: badgeColor,
                    padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  }}>
                    {overall}% · {badgeLabel}
                  </div>
                )}
                <div style={{ paddingRight: hasProfile ? 100 : 0 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>{job.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--nriva-text-light)' }}>{job.company}</p>
                </div>
                <div style={{ display: 'flex', gap: 12, margin: '12px 0', fontSize: 12, color: 'var(--nriva-text-light)', flexWrap: 'wrap' }}>
                  <span>📍 {job.location}</span>
                  <span>⏱ {job.duration}</span>
                  {job.expectedHoursPerDay && <span>🕐 {job.expectedHoursPerDay}/day</span>}
                  <span>💰 {job.stipend}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {(job.skills || []).slice(0, 4).map(s => (
                    <span key={s} style={{
                      background: (userProfile?.skills || []).some(us => us.toLowerCase() === s.toLowerCase()) ? '#dcfce7' : '#e8eaf6',
                      color: (userProfile?.skills || []).some(us => us.toLowerCase() === s.toLowerCase()) ? '#15803d' : 'var(--nriva-primary)',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                    }}>{s}</span>
                  ))}
                </div>
                {reasons.length > 0 && (
                  <div style={{ background: '#f8fafc', borderRadius: 6, padding: '8px 10px', marginBottom: 12, fontSize: 12, lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, color: 'var(--nriva-text)', marginBottom: 4, fontSize: 11 }}>Why we picked this</div>
                    {reasons.map((r, i) => (
                      <div key={i} style={{ color: r.kind === 'gap' ? '#92400e' : 'var(--nriva-text-light)' }}>
                        {r.icon} {r.label}{r.detail ? ` · ${r.detail}` : ''}
                      </div>
                    ))}
                  </div>
                )}
                <Link to={`/intern/apply/${job.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
                  Apply Now
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

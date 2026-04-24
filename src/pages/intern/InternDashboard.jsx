import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships, useApplications } from '../../hooks/useFirestore'
import { MAX_INTERN_APPLICATIONS, getUser } from '../../services/firestore'
import { formatDate } from '../../utils/date'
import { statusBadgeClass, statusDisplay } from '../../utils/status'

function scoreMatch(internship, userProfile) {
  if (!userProfile) return 0
  let score = 0
  const userSkills = (userProfile.skills || []).map(s => s.toLowerCase())
  const userInterests = userProfile.interests || []

  // Skill overlap: each matching skill = 3 points
  const internSkills = (internship.skills || []).map(s => s.toLowerCase())
  userSkills.forEach(s => {
    if (internSkills.some(is => is.includes(s) || s.includes(is))) score += 3
  })

  // Interest category match: map internship to categories
  const titleLower = (internship.title || '').toLowerCase()
  const descLower = (internship.description || '').toLowerCase()
  const combined = titleLower + ' ' + descLower

  const categoryKeywords = {
    software: ['software', 'developer', 'programming', 'code', 'web', 'app'],
    data: ['data', 'analytics', 'sql', 'python', 'statistics'],
    marketing: ['marketing', 'social media', 'content', 'brand', 'campaign'],
    design: ['design', 'graphic', 'ui', 'ux', 'figma', 'creative'],
    finance: ['finance', 'accounting', 'budget', 'financial', 'bookkeeping'],
    ai: ['ai', 'machine learning', 'artificial intelligence', 'automation'],
    healthcare: ['health', 'medical', 'clinical', 'patient', 'care'],
    sales: ['sales', 'business development', 'revenue', 'client'],
    engineering: ['cloud', 'devops', 'infrastructure', 'engineer', 'aws', 'azure'],
    media: ['journalism', 'writing', 'editor', 'media', 'news', 'blog'],
    nonprofit: ['non-profit', 'nonprofit', 'volunteer', 'community', 'nriva'],
  }

  userInterests.forEach(interest => {
    const keywords = categoryKeywords[interest] || []
    if (keywords.some(kw => combined.includes(kw))) score += 5
  })

  return score
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

  // Smart matching: score and sort internships
  const openInternships = allInternships.filter(i => i.status === 'open')
  const recommended = userProfile?.skills?.length || userProfile?.interests?.length
    ? [...openInternships].sort((a, b) => scoreMatch(b, userProfile) - scoreMatch(a, userProfile)).slice(0, 6)
    : openInternships.slice(0, 3)

  const hasProfile = userProfile?.skills?.length > 0

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
                Based on your skills: {(userProfile.skills || []).slice(0, 3).join(', ')}{userProfile.skills?.length > 3 ? ` +${userProfile.skills.length - 3} more` : ''}
              </p>
            )}
          </div>
          <Link to="/intern/browse" style={{ color: 'var(--nriva-primary)', fontSize: 14, fontWeight: 500 }}>
            Browse All →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {recommended.map(job => {
            const matchScore = hasProfile ? scoreMatch(job, userProfile) : 0
            return (
              <div key={job.id} style={{
                border: '1px solid var(--nriva-border)', borderRadius: 'var(--nriva-radius)', padding: 16,
                position: 'relative',
              }}>
                {matchScore > 0 && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: matchScore >= 10 ? '#dcfce7' : '#fef3c7',
                    color: matchScore >= 10 ? '#15803d' : '#92400e',
                    padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  }}>
                    {matchScore >= 10 ? 'Great match' : 'Good match'}
                  </div>
                )}
                <div>
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
                <Link to={`/intern/apply/${job.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
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

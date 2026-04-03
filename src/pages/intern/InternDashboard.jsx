import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships, useApplications } from '../../hooks/useFirestore'

export default function InternDashboard() {
  const { user } = useAuth()
  const { data: allApplications } = useApplications({ applicantUid: user?.uid })
  const { data: allInternships } = useInternships()
  const myApplications = allApplications.slice(0, 3)
  const recommended = allInternships.filter(i => i.status === 'open').slice(0, 3)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, Student!</h1>
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
          <div className="stat-label">Applications Submitted</div>
          <div className="stat-value">{allApplications.length}</div>
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
          <div className="stat-label">Available Positions</div>
          <div className="stat-value">{allInternships.filter(i => i.status === 'open').length}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>My Recent Applications</h2>
          <Link to="/intern/applications" style={{ color: 'var(--nriva-primary)', fontSize: 14, fontWeight: 500 }}>
            View All →
          </Link>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Company</th>
                <th>Applied</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myApplications.map(app => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 500 }}>{app.internshipTitle}</td>
                  <td>{app.company}</td>
                  <td>{new Date(app.appliedDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${app.status === 'shortlisted' ? 'open' : app.status === 'under_review' ? 'pending' : app.status === 'accepted' ? 'filled' : 'closed'}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recommended for You</h2>
          <Link to="/intern/browse" style={{ color: 'var(--nriva-primary)', fontSize: 14, fontWeight: 500 }}>
            Browse All →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {recommended.map(job => (
            <div key={job.id} style={{
              border: '1px solid var(--nriva-border)',
              borderRadius: 'var(--nriva-radius)',
              padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>{job.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--nriva-text-light)' }}>{job.company}</p>
                </div>
                <span className="badge badge-open">Open</span>
              </div>
              <div style={{ display: 'flex', gap: 12, margin: '12px 0', fontSize: 12, color: 'var(--nriva-text-light)' }}>
                <span>📍 {job.location}</span>
                <span>⏱ {job.duration}</span>
                <span>💰 {job.stipend}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {job.skills.slice(0, 3).map(s => (
                  <span key={s} style={{
                    background: '#e8eaf6',
                    color: 'var(--nriva-primary)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                  }}>{s}</span>
                ))}
              </div>
              <Link to={`/intern/apply/${job.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                Apply Now
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

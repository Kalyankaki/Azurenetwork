import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships, useApplications } from '../../hooks/useFirestore'

export default function EmployerDashboard() {
  const { user } = useAuth()
  const { data: myPostings } = useInternships({ employerUid: user?.uid })
  const { data: allApps } = useApplications()
  const recentApps = allApps.slice(0, 4)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employer Dashboard</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            Welcome back! Here&apos;s your hiring overview.
          </p>
        </div>
        <Link to="/employer/new-posting" className="btn btn-primary">
          + Post New Internship
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Postings</div>
          <div className="stat-value">{myPostings.filter(p => p.status === 'open').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Applicants</div>
          <div className="stat-value">{myPostings.reduce((sum, p) => sum + p.applicants, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Shortlisted</div>
          <div className="stat-value" style={{ color: 'var(--nriva-success)' }}>{allApps.filter(a => a.status === 'shortlisted').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Positions Filled</div>
          <div className="stat-value" style={{ color: 'var(--nriva-accent)' }}>{myPostings.filter(p => p.status === 'filled').length}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>My Internship Postings</h2>
          <Link to="/employer/postings" style={{ color: 'var(--nriva-primary)', fontSize: 14, fontWeight: 500 }}>
            View All →
          </Link>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Status</th>
                <th>Applicants</th>
                <th>Positions</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {myPostings.map(job => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{job.company}</div>
                  </td>
                  <td><span className={`badge badge-${job.status}`}>{job.status}</span></td>
                  <td>{job.applicants}</td>
                  <td>{job.positions}</td>
                  <td>{new Date(job.deadline).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recent Applications</h2>
          <Link to="/employer/applicants" style={{ color: 'var(--nriva-primary)', fontSize: 14, fontWeight: 500 }}>
            View All →
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recentApps.map(app => (
            <div key={app.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', border: '1px solid var(--nriva-border)', borderRadius: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#e8eaf6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, color: 'var(--nriva-primary)', fontSize: 14,
                }}>
                  {app.applicantName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{app.applicantName}</div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{app.internshipTitle}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`badge badge-${app.status === 'shortlisted' ? 'open' : app.status === 'under_review' ? 'pending' : app.status === 'accepted' ? 'filled' : 'closed'}`}>
                  {app.status.replace('_', ' ')}
                </span>
                <span style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>
                  {new Date(app.appliedDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

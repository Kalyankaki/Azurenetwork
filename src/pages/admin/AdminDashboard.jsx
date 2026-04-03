import { Link } from 'react-router-dom'
import { useInternships, useApplications, useMessages } from '../../hooks/useFirestore'

export default function AdminDashboard() {
  const { data: internships } = useInternships()
  const { data: applications } = useApplications()
  const { data: messages } = useMessages()

  const openPositions = internships.filter(i => i.status === 'open').length
  const totalApplicants = applications.length
  const shortlisted = applications.filter(a => a.status === 'shortlisted').length
  const accepted = applications.filter(a => a.status === 'accepted').length
  const openMessages = messages.filter(m => m.status === 'open').length
  const resolvedMessages = messages.filter(m => m.status === 'resolved').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            NRIVA Internship Program Overview
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Internships</div>
          <div className="stat-value">{internships.length}</div>
          <div style={{ fontSize: 12, color: 'var(--nriva-success)', marginTop: 4 }}>
            {openPositions} currently open
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{totalApplicants}</div>
          <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginTop: 4 }}>
            across all positions
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Shortlisted</div>
          <div className="stat-value" style={{ color: 'var(--nriva-warning)' }}>{shortlisted}</div>
          <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginTop: 4 }}>
            awaiting interviews
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Accepted</div>
          <div className="stat-value" style={{ color: 'var(--nriva-success)' }}>{accepted}</div>
          <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginTop: 4 }}>
            offers extended
          </div>
        </div>
      </div>

      {/* Messages/Issues Summary */}
      {(openMessages > 0 || resolvedMessages > 0) && (
        <Link to="/admin/messages" style={{ textDecoration: 'none' }}>
          <div className="card" style={{
            marginBottom: 24, padding: '16px 20px',
            border: openMessages > 0 ? '2px solid #fbbf24' : '1px solid var(--nriva-border)',
            background: openMessages > 0 ? '#fffbeb' : 'white',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>✉️</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--nriva-text)' }}>
                    Messages & Issues
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--nriva-text-light)' }}>
                    {openMessages} open · {resolvedMessages} resolved
                  </div>
                </div>
              </div>
              {openMessages > 0 && (
                <span style={{
                  background: '#dc2626', color: 'white', padding: '4px 12px',
                  borderRadius: 20, fontSize: 13, fontWeight: 700,
                }}>
                  {openMessages} need attention
                </span>
              )}
            </div>
          </div>
        </Link>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '2fr 1fr' : '1fr', gap: 24 }}>
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent Applications</h2>
          {applications.length === 0 ? (
            <p style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>No applications yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Applicant</th><th>Position</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {applications.slice(0, 8).map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{app.applicantName}</td>
                      <td style={{ fontSize: 13 }}>{app.internshipTitle}</td>
                      <td><span className={`badge badge-${app.status === 'shortlisted' ? 'open' : app.status === 'accepted' ? 'filled' : 'pending'}`}>
                        {(app.status || 'pending').replace('_', ' ')}
                      </span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Internships by Status</h3>
            {internships.length === 0 ? (
              <p style={{ color: 'var(--nriva-text-light)', fontSize: 13 }}>No internships yet.</p>
            ) : (
              ['open', 'closed', 'filled'].map(status => {
                const count = internships.filter(i => i.status === status).length
                const pct = internships.length > 0 ? Math.round((count / internships.length) * 100) : 0
                return (
                  <div key={status} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ textTransform: 'capitalize' }}>{status}</span>
                      <span style={{ fontWeight: 600 }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: status === 'open' ? 'var(--nriva-success)' : status === 'closed' ? 'var(--nriva-danger)' : 'var(--nriva-primary)',
                        borderRadius: 4, transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/admin/internships" className="btn btn-outline" style={{ justifyContent: 'center' }}>Manage Internships</Link>
              <Link to="/admin/applications" className="btn btn-outline" style={{ justifyContent: 'center' }}>Review Applications</Link>
              <Link to="/admin/messages" className="btn btn-outline" style={{ justifyContent: 'center' }}>View Messages</Link>
              <Link to="/admin/users" className="btn btn-outline" style={{ justifyContent: 'center' }}>Manage Users</Link>
              <Link to="/admin/reports" className="btn btn-outline" style={{ justifyContent: 'center' }}>View Reports</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

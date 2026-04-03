import { Link } from 'react-router-dom'
import { sampleInternships, sampleApplications } from '../../data'

export default function AdminDashboard() {
  const openPositions = sampleInternships.filter(i => i.status === 'open').length
  const totalApplicants = sampleApplications.length
  const shortlisted = sampleApplications.filter(a => a.status === 'shortlisted').length
  const accepted = sampleApplications.filter(a => a.status === 'accepted').length

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
          <div className="stat-value">{sampleInternships.length}</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '2fr 1fr' : '1fr', gap: 24 }}>
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent Activity</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-date">Mar 21, 2026</div>
              <div className="timeline-content">New application from <strong>Meera Krishnan</strong> for Marketing Intern</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">Mar 20, 2026</div>
              <div className="timeline-content">New posting: <strong>Marketing & Social Media Intern</strong> by NRIVA Foundation</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">Mar 19, 2026</div>
              <div className="timeline-content"><strong>Ravi Teja</strong> applied for Graphic Design Intern</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">Mar 18, 2026</div>
              <div className="timeline-content">New posting: <strong>Graphic Design Intern</strong> by CreativeVasavi Studio</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">Mar 17, 2026</div>
              <div className="timeline-content"><strong>Sneha Reddy</strong> shortlisted for Software Development Intern</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">Mar 15, 2026</div>
              <div className="timeline-content">New posting: <strong>Software Development Intern</strong> by TechVasavi Solutions</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Internships by Status</h3>
            {['open', 'closed', 'filled'].map(status => {
              const count = sampleInternships.filter(i => i.status === status).length
              const pct = Math.round((count / sampleInternships.length) * 100)
              return (
                <div key={status} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ textTransform: 'capitalize' }}>{status}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: status === 'open' ? 'var(--nriva-success)' : status === 'closed' ? 'var(--nriva-danger)' : 'var(--nriva-primary)',
                      borderRadius: 4,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/admin/internships" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                Manage Internships
              </Link>
              <Link to="/admin/applications" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                Review Applications
              </Link>
              <Link to="/admin/reports" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                View Reports
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Top Employers</h3>
            {[
              { name: 'TechVasavi Solutions', postings: 2 },
              { name: 'NRIVA Foundation', postings: 2 },
              { name: 'DataBridge Corp', postings: 1 },
            ].map(emp => (
              <div key={emp.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid var(--nriva-border)',
                fontSize: 13,
              }}>
                <span>{emp.name}</span>
                <span style={{ fontWeight: 600, color: 'var(--nriva-primary)' }}>{emp.postings} postings</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

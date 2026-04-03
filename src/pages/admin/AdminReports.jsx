import { useState } from 'react'
import { useInternships, useApplications } from '../../hooks/useFirestore'

export default function AdminReports() {
  const { data: sampleInternships } = useInternships()
  const { data: sampleApplications } = useApplications()
  const [activeTab, setActiveTab] = useState('overview')

  const totalPositions = sampleInternships.reduce((sum, i) => sum + i.positions, 0)
  const totalApplicants = sampleInternships.reduce((sum, i) => sum + i.applicants, 0)

  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
      </div>

      <div className="tabs">
        {['overview', 'internships', 'applications', 'employers'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Positions</div>
              <div className="stat-value">{totalPositions}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Applicants</div>
              <div className="stat-value">{totalApplicants}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg. Applicants/Position</div>
              <div className="stat-value">
                {(totalApplicants / sampleInternships.length).toFixed(1)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Fill Rate</div>
              <div className="stat-value">
                {Math.round((sampleInternships.filter(i => i.status === 'filled').length / sampleInternships.length) * 100)}%
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Applications by Position</h3>
            {sampleInternships.map(job => {
              const maxApplicants = Math.max(...sampleInternships.map(i => i.applicants))
              const pct = (job.applicants / maxApplicants) * 100
              return (
                <div key={job.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{job.title}</span>
                    <span style={{ color: 'var(--nriva-text-light)' }}>{job.applicants} applicants</span>
                  </div>
                  <div style={{ height: 24, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, var(--nriva-primary) 0%, var(--nriva-primary-light) 100%)`,
                      borderRadius: 6,
                      transition: 'width 0.5s ease',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 8,
                    }}>
                      <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{job.applicants}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>By Location</h3>
              {['Remote', 'New York, NY', 'San Francisco, CA', 'Houston, TX'].map(loc => {
                const count = sampleInternships.filter(i => i.location === loc).length
                return (
                  <div key={loc} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid var(--nriva-border)',
                    fontSize: 13,
                  }}>
                    <span>{loc}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                )
              })}
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>By Type</h3>
              {['Full-time', 'Part-time'].map(type => {
                const count = sampleInternships.filter(i => i.type === type).length
                const pct = Math.round((count / sampleInternships.length) * 100)
                return (
                  <div key={type} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{type}</span>
                      <span style={{ fontWeight: 600 }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: type === 'Full-time' ? 'var(--nriva-primary)' : 'var(--nriva-accent)',
                        borderRadius: 4,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'internships' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Internship Details Report</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Stipend</th>
                  <th>Applicants</th>
                  <th>Positions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sampleInternships.map(job => (
                  <tr key={job.id}>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{job.title}</td>
                    <td style={{ fontSize: 13 }}>{job.company}</td>
                    <td style={{ fontSize: 13 }}>{job.location}</td>
                    <td style={{ fontSize: 13 }}>{job.type}</td>
                    <td style={{ fontSize: 13 }}>{job.duration}</td>
                    <td style={{ fontSize: 13 }}>{job.stipend}</td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{job.applicants}</td>
                    <td style={{ fontSize: 13 }}>{job.positions}</td>
                    <td><span className={`badge badge-${job.status}`}>{job.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Application Pipeline Report</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Position</th>
                  <th>University</th>
                  <th>Major</th>
                  <th>GPA</th>
                  <th>Graduation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sampleApplications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{app.applicantName}</div>
                      <div style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>{app.email}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{app.internshipTitle}</td>
                    <td style={{ fontSize: 13 }}>{app.university}</td>
                    <td style={{ fontSize: 13 }}>{app.major}</td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{app.gpa}</td>
                    <td style={{ fontSize: 13 }}>{app.graduationYear}</td>
                    <td>
                      <span className={`badge badge-${app.status === 'shortlisted' ? 'open' : app.status === 'under_review' ? 'pending' : app.status === 'accepted' ? 'filled' : app.status === 'pending' ? 'pending' : 'closed'}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'employers' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Employer Activity Report</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employer</th>
                  <th>Company</th>
                  <th>Postings</th>
                  <th>Total Applicants</th>
                  <th>Positions Open</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(sampleInternships.map(i => i.employer))).map(employer => {
                  const postings = sampleInternships.filter(i => i.employer === employer)
                  const totalApps = postings.reduce((sum, p) => sum + p.applicants, 0)
                  const openPositions = postings.filter(p => p.status === 'open').reduce((sum, p) => sum + p.positions, 0)
                  return (
                    <tr key={employer}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{employer}</td>
                      <td style={{ fontSize: 13 }}>{postings[0].company}</td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{postings.length}</td>
                      <td style={{ fontSize: 13 }}>{totalApps}</td>
                      <td style={{ fontSize: 13 }}>{openPositions}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

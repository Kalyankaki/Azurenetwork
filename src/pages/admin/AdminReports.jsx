import { useState } from 'react'
import { useInternships, useApplications, useUsers } from '../../hooks/useFirestore'
import { formatDate } from '../../utils/date'
import { statusBadgeClass, statusDisplay, statusLabel } from '../../utils/status'
import { exportCSV } from '../../utils/csv'

function safeDiv(a, b) {
  if (!b || b === 0) return 0
  return a / b
}

function safePct(a, b) {
  if (!b || b === 0) return 0
  return Math.round((a / b) * 100)
}

export default function AdminReports() {
  const { data: internships } = useInternships()
  const { data: applications } = useApplications()
  const { data: users } = useUsers()
  const [activeTab, setActiveTab] = useState('overview')

  const totalPositions = internships.reduce((sum, i) => sum + (i.positions || 0), 0)
  const totalApplicants = applications.length

  // Build a map of internshipId -> application count from the applications collection
  const appCountByInternship = {}
  applications.forEach(a => {
    const key = a.internshipId || 'unknown'
    appCountByInternship[key] = (appCountByInternship[key] || 0) + 1
  })

  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-outline" onClick={() => exportCSV(
            internships.map(i => ({ title: i.title, company: i.company, employer: i.employerName, status: i.status, location: i.location, type: i.type, duration: i.duration, positions: i.positions, deadline: i.deadline })),
            'nriva_internships'
          )}>Export Internships</button>
          <button className="btn btn-sm btn-outline" onClick={() => exportCSV(
            applications.map(a => ({ applicant: a.applicantName, email: a.email, internship: a.internshipTitle, company: a.company, status: statusLabel(a.status), school: a.school, gradeLevel: a.gradeLevel, availableFrom: a.availableFrom, availableTo: a.availableTo, hoursPerDay: a.hoursPerDay })),
            'nriva_applications'
          )}>Export Applications</button>
          <button className="btn btn-sm btn-outline" onClick={() => exportCSV(
            users.filter(u => (u.roles || []).includes('intern')).map(u => ({ name: u.displayName, email: u.email, school: u.school, gradeLevel: u.gradeLevel, skills: (u.skills || []).join('; '), interests: (u.interests || []).join('; '), membership: u.nrivaMembership })),
            'nriva_interns'
          )}>Export Interns</button>
        </div>
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
                {internships.length > 0 ? safeDiv(totalApplicants, internships.length).toFixed(1) : 'N/A'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Fill Rate</div>
              <div className="stat-value">
                {internships.length > 0 ? `${safePct(internships.filter(i => i.status === 'filled').length, internships.length)}%` : 'N/A'}
              </div>
            </div>
          </div>

          {internships.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Applications by Position</h3>
              {internships.map(job => {
                const jobAppCount = appCountByInternship[job.id] || 0
                const maxApplicants = Math.max(...internships.map(i => appCountByInternship[i.id] || 0), 1)
                const pct = safeDiv(jobAppCount, maxApplicants) * 100
                return (
                  <div key={job.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{job.title}</span>
                      <span style={{ color: 'var(--nriva-text-light)' }}>{jobAppCount} applicants</span>
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
                        {pct > 10 && <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{jobAppCount}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>By Location</h3>
              {internships.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--nriva-text-light)' }}>No data yet</p>
              ) : (
                Array.from(new Set(internships.map(i => i.location))).map(loc => {
                  const count = internships.filter(i => i.location === loc).length
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
                })
              )}
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>By Type</h3>
              {['Full-time', 'Part-time'].map(type => {
                const count = internships.filter(i => i.type === type).length
                const pct = safePct(count, internships.length)
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
                  <th>Positions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {internships.map(job => (
                  <tr key={job.id}>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{job.title}</td>
                    <td style={{ fontSize: 13 }}>{job.company}</td>
                    <td style={{ fontSize: 13 }}>{job.location}</td>
                    <td style={{ fontSize: 13 }}>{job.type}</td>
                    <td style={{ fontSize: 13 }}>{job.duration}</td>
                    <td style={{ fontSize: 13 }}>{job.stipend}</td>
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
                  <th>School</th>
                  <th>Grade Level</th>
                  <th>Applied</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{app.applicantName}</div>
                      <div style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>{app.email}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{app.internshipTitle}</td>
                    <td style={{ fontSize: 13 }}>{app.school || app.university || '—'}</td>
                    <td style={{ fontSize: 13 }}>{app.gradeLevel || app.graduationYear || '—'}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(app.appliedDate)}</td>
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
        </div>
      )}

      {activeTab === 'employers' && (() => {
        const empData = {}
        internships.forEach(i => {
          const key = i.employerName || i.employer || 'Unknown'
          if (!empData[key]) empData[key] = { name: key, company: i.company, postings: 0, openPos: 0, totalApps: 0, reviewed: 0, offered: 0, accepted: 0 }
          empData[key].postings++
          if (i.status === 'open') empData[key].openPos += (i.positions || 0)
        })
        applications.forEach(a => {
          const intern = internships.find(i => i.id === a.internshipId)
          const key = intern?.employerName || intern?.employer || 'Unknown'
          if (empData[key]) {
            empData[key].totalApps++
            if (['under_review', 'shortlisted', 'offered', 'offer_accepted', 'rejected'].includes(a.status)) empData[key].reviewed++
            if (['offered', 'offer_accepted', 'offer_declined'].includes(a.status)) empData[key].offered++
            if (a.status === 'offer_accepted') empData[key].accepted++
          }
        })
        const empList = Object.values(empData).sort((a, b) => b.totalApps - a.totalApps)
        return (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Employer Performance Report</h3>
            <button className="btn btn-sm btn-outline" onClick={() => exportCSV(empList.map(e => ({
              employer: e.name, company: e.company, postings: e.postings, open_positions: e.openPos,
              applications: e.totalApps, reviewed: e.reviewed, review_rate: e.totalApps > 0 ? Math.round((e.reviewed / e.totalApps) * 100) + '%' : 'N/A',
              offers_sent: e.offered, offers_accepted: e.accepted,
            })), 'nriva_employer_performance')}>
              Export CSV
            </button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employer</th>
                  <th>Company</th>
                  <th>Postings</th>
                  <th>Applications</th>
                  <th>Review Rate</th>
                  <th>Offers</th>
                  <th>Accepted</th>
                </tr>
              </thead>
              <tbody>
                {empList.map(e => {
                  const reviewRate = e.totalApps > 0 ? Math.round((e.reviewed / e.totalApps) * 100) : 0
                  return (
                    <tr key={e.name}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{e.name}</td>
                      <td style={{ fontSize: 13 }}>{e.company || '—'}</td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{e.postings}</td>
                      <td style={{ fontSize: 13 }}>{e.totalApps}</td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: 13, color: reviewRate >= 80 ? '#15803d' : reviewRate >= 50 ? '#ca8a04' : '#dc2626' }}>
                          {reviewRate}%
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{e.offered}</td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{e.accepted}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        )
      })()}
    </div>
  )
}

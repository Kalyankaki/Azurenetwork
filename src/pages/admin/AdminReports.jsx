import { useState, useMemo } from 'react'
import { useInternships, useApplications, useUsers } from '../../hooks/useFirestore'
import { formatDate } from '../../utils/date'
import { statusBadgeClass, statusDisplay, statusLabel, APPLICATION_STATUS_LABELS } from '../../utils/status'
import { exportCSV } from '../../utils/csv'
import { INTERNSHIP_STATUSES, isSuperAdmin } from '../../services/firestore'

function safeDiv(a, b) {
  if (!b || b === 0) return 0
  return a / b
}

function safePct(a, b) {
  if (!b || b === 0) return 0
  return Math.round((a / b) * 100)
}

function matchesText(haystacks, needle) {
  if (!needle) return true
  const q = needle.trim().toLowerCase()
  if (!q) return true
  return haystacks.some(h => (h || '').toString().toLowerCase().includes(q))
}

const INTERNSHIP_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: INTERNSHIP_STATUSES.OPEN, label: 'Open' },
  { value: INTERNSHIP_STATUSES.PENDING_APPROVAL, label: 'Pending Approval' },
  { value: INTERNSHIP_STATUSES.CLOSED, label: 'Closed' },
  { value: INTERNSHIP_STATUSES.FILLED, label: 'Filled' },
  { value: INTERNSHIP_STATUSES.REJECTED, label: 'Rejected' },
]

const APPLICATION_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

const INTERN_ONBOARDED_OPTIONS = [
  { value: 'all', label: 'All Interns' },
  { value: 'onboarded', label: 'Onboarded' },
  { value: 'pending', label: 'Not Onboarded' },
]

const EMPLOYER_ACTIVITY_OPTIONS = [
  { value: 'all', label: 'All Employers' },
  { value: 'active', label: 'With Postings' },
  { value: 'inactive', label: 'No Postings' },
]

const filterRow = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }
const searchInput = { flex: '1 1 260px', minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--nriva-border)', fontSize: 13 }
const selectInput = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--nriva-border)', fontSize: 13, background: 'white' }
const resultCount = { fontSize: 12, color: 'var(--nriva-text-light)', marginLeft: 'auto' }

export default function AdminReports() {
  const { data: internships } = useInternships()
  const { data: applications } = useApplications()
  const { data: users } = useUsers()
  const [activeTab, setActiveTab] = useState('overview')

  // Per-tab filter state
  const [internFilter, setInternFilter] = useState({ q: '', status: 'all' })
  const [appFilter, setAppFilter] = useState({ q: '', status: 'all' })
  const [employerFilter, setEmployerFilter] = useState({ q: '', status: 'all' })
  const [internUserFilter, setInternUserFilter] = useState({ q: '', status: 'all' })

  const totalPositions = internships.reduce((sum, i) => sum + (i.positions || 0), 0)
  const totalApplicants = applications.length

  // Build a map of internshipId -> application count from the applications collection
  const appCountByInternship = {}
  applications.forEach(a => {
    const key = a.internshipId || 'unknown'
    appCountByInternship[key] = (appCountByInternship[key] || 0) + 1
  })

  // Build a map of applicantUid -> application count for interns tab
  const appCountByApplicant = useMemo(() => {
    const out = {}
    applications.forEach(a => {
      const key = a.applicantUid || 'unknown'
      out[key] = (out[key] || 0) + 1
    })
    return out
  }, [applications])

  const filteredInternships = useMemo(() => {
    return internships.filter(job => {
      if (internFilter.status !== 'all' && job.status !== internFilter.status) return false
      return matchesText([job.title, job.company, job.location, job.employerName, job.employer], internFilter.q)
    })
  }, [internships, internFilter])

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      if (appFilter.status !== 'all' && app.status !== appFilter.status) return false
      return matchesText([app.applicantName, app.email, app.internshipTitle, app.company, app.school, app.university], appFilter.q)
    })
  }, [applications, appFilter])

  // Interns = users with 'intern' role (excluding super admin by email)
  const internUsers = useMemo(() => {
    return users.filter(u => {
      if (isSuperAdmin(u.email)) return false
      const roles = u.roles || []
      return roles.includes('intern') || u.requestedRole === 'intern'
    })
  }, [users])

  const filteredInternUsers = useMemo(() => {
    return internUsers.filter(u => {
      if (internUserFilter.status === 'onboarded' && !u.onboarded) return false
      if (internUserFilter.status === 'pending' && u.onboarded) return false
      return matchesText([u.displayName, u.email, u.school, u.gradeLevel, (u.skills || []).join(' ')], internUserFilter.q)
    })
  }, [internUsers, internUserFilter])

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
        {['overview', 'internships', 'applications', 'interns', 'employers'].map(tab => (
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
          <div style={filterRow}>
            <input
              type="text"
              placeholder="Search title, company, location, employer…"
              value={internFilter.q}
              onChange={(e) => setInternFilter(f => ({ ...f, q: e.target.value }))}
              style={searchInput}
            />
            <select
              value={internFilter.status}
              onChange={(e) => setInternFilter(f => ({ ...f, status: e.target.value }))}
              style={selectInput}
            >
              {INTERNSHIP_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span style={resultCount}>{filteredInternships.length} of {internships.length}</span>
          </div>
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
                {filteredInternships.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, fontSize: 13, color: 'var(--nriva-text-light)' }}>No internships match the filters.</td></tr>
                ) : filteredInternships.map(job => (
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
          <div style={filterRow}>
            <input
              type="text"
              placeholder="Search applicant, email, position, school…"
              value={appFilter.q}
              onChange={(e) => setAppFilter(f => ({ ...f, q: e.target.value }))}
              style={searchInput}
            />
            <select
              value={appFilter.status}
              onChange={(e) => setAppFilter(f => ({ ...f, status: e.target.value }))}
              style={selectInput}
            >
              {APPLICATION_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span style={resultCount}>{filteredApplications.length} of {applications.length}</span>
          </div>
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
                {filteredApplications.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, fontSize: 13, color: 'var(--nriva-text-light)' }}>No applications match the filters.</td></tr>
                ) : filteredApplications.map(app => (
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

      {activeTab === 'interns' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Intern Roster</h3>
          <div style={filterRow}>
            <input
              type="text"
              placeholder="Search name, email, school, skills…"
              value={internUserFilter.q}
              onChange={(e) => setInternUserFilter(f => ({ ...f, q: e.target.value }))}
              style={searchInput}
            />
            <select
              value={internUserFilter.status}
              onChange={(e) => setInternUserFilter(f => ({ ...f, status: e.target.value }))}
              style={selectInput}
            >
              {INTERN_ONBOARDED_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span style={resultCount}>{filteredInternUsers.length} of {internUsers.length}</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>School</th>
                  <th>Grade</th>
                  <th>Skills</th>
                  <th>Applications</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredInternUsers.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, fontSize: 13, color: 'var(--nriva-text-light)' }}>No interns match the filters.</td></tr>
                ) : filteredInternUsers.map(u => {
                  const skills = u.skills || []
                  const shownSkills = skills.slice(0, 3)
                  const extra = skills.length - shownSkills.length
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{u.displayName || '—'}</div>
                        {!u.onboarded && (
                          <div style={{ fontSize: 11, color: '#b45309' }}>Not onboarded</div>
                        )}
                      </td>
                      <td style={{ fontSize: 13 }}>{u.email || '—'}</td>
                      <td style={{ fontSize: 13 }}>{u.school || '—'}</td>
                      <td style={{ fontSize: 13 }}>{u.gradeLevel || '—'}</td>
                      <td style={{ fontSize: 13 }}>
                        {skills.length === 0 ? (
                          <span style={{ color: 'var(--nriva-text-light)' }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {shownSkills.map(s => (
                              <span key={s} style={{ fontSize: 11, padding: '2px 8px', background: '#eef2ff', color: '#1a237e', borderRadius: 10 }}>{s}</span>
                            ))}
                            {extra > 0 && (
                              <span style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>+{extra}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{appCountByApplicant[u.id] || 0}</td>
                      <td style={{ fontSize: 13 }}>{formatDate(u.createdAt)}</td>
                    </tr>
                  )
                })}
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
        const filteredEmpList = empList.filter(e => {
          if (employerFilter.status === 'active' && e.postings === 0) return false
          if (employerFilter.status === 'inactive' && e.postings > 0) return false
          return matchesText([e.name, e.company], employerFilter.q)
        })
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
          <div style={filterRow}>
            <input
              type="text"
              placeholder="Search employer or company…"
              value={employerFilter.q}
              onChange={(e) => setEmployerFilter(f => ({ ...f, q: e.target.value }))}
              style={searchInput}
            />
            <select
              value={employerFilter.status}
              onChange={(e) => setEmployerFilter(f => ({ ...f, status: e.target.value }))}
              style={selectInput}
            >
              {EMPLOYER_ACTIVITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span style={resultCount}>{filteredEmpList.length} of {empList.length}</span>
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
                {filteredEmpList.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, fontSize: 13, color: 'var(--nriva-text-light)' }}>No employers match the filters.</td></tr>
                ) : filteredEmpList.map(e => {
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

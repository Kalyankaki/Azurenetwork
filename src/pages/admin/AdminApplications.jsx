import { useState } from 'react'
import { useApplications } from '../../hooks/useFirestore'
import { updateApplicationStatus } from '../../services/firestore'
import { formatDate } from '../../utils/date'
import Toast from '../../components/Toast'

const statusLabels = {
  pending: 'Pending',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

const statusBadgeClass = {
  pending: 'pending',
  under_review: 'pending',
  shortlisted: 'open',
  accepted: 'filled',
  rejected: 'closed',
}

export default function AdminApplications() {
  const { data: applications, loading } = useApplications()
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = applications.filter(app => {
    const name = (app.applicantName || '').toLowerCase()
    const title = (app.internshipTitle || '').toLowerCase()
    const school = (app.school || app.university || '').toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) ||
      title.includes(search.toLowerCase()) ||
      school.includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || app.status === statusFilter
    return matchSearch && matchStatus
  })

  const updateStatus = async (id, status) => {
    try {
      await updateApplicationStatus(id, status)
      setToast(`Application status updated to ${statusLabels[status]}`)
    } catch (err) {
      setToast('Error: ' + err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>All Applications</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          {filtered.length} {filtered.length === 1 ? 'application' : 'applications'}
        </span>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search by name, position, or school..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {Object.entries(statusLabels).map(([key, label]) => {
          const count = applications.filter(a => a.status === key).length
          return (
            <div key={key} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter(key)}>
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ fontSize: 24 }}>{count}</div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading applications...</p></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Position</th>
                  <th>Company</th>
                  <th>School</th>
                  <th>Grade Level</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--nriva-text-light)' }}>
                      No applications found.
                    </td>
                  </tr>
                )}
                {filtered.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{app.applicantName || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{app.email || '—'}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{app.internshipTitle || '—'}</td>
                    <td style={{ fontSize: 13 }}>{app.company || '—'}</td>
                    <td style={{ fontSize: 13 }}>{app.school || app.university || '—'}</td>
                    <td style={{ fontSize: 13 }}>{app.gradeLevel || '—'}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(app.appliedDate)}</td>
                    <td>
                      <span className={`badge badge-${statusBadgeClass[app.status] || 'pending'}`}>
                        {statusLabels[app.status] || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-control"
                        aria-label="Change application status"
                        style={{ padding: '4px 8px', fontSize: 12, minWidth: 120 }}
                        value={app.status || 'pending'}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                      >
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

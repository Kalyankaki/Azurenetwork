import { useState } from 'react'
import { useApplications } from '../../hooks/useFirestore'
import { updateApplicationStatus } from '../../services/firestore'
import Toast from '../../components/Toast'
import { formatDate } from '../../utils/date'

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
  const { data: applications } = useApplications()
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = applications.filter(app => {
    const matchSearch = app.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      app.internshipTitle.toLowerCase().includes(search.toLowerCase()) ||
      (app.university || app.school || '').toLowerCase().includes(search.toLowerCase())
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
          {filtered.length} applications
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

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Position</th>
                <th>Company</th>
                <th>University</th>
                <th>GPA</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{app.applicantName}</div>
                    <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{app.email}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{app.internshipTitle}</td>
                  <td style={{ fontSize: 13 }}>{app.company}</td>
                  <td style={{ fontSize: 13 }}>{app.university || app.school}</td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{app.gpa}</td>
                  <td style={{ fontSize: 13 }}>{formatDate(app.appliedDate)}</td>
                  <td>
                    <span className={`badge badge-${statusBadgeClass[app.status]}`}>
                      {statusLabels[app.status]}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-control"
                      style={{ padding: '4px 8px', fontSize: 12, minWidth: 120 }}
                      value={app.status}
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

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

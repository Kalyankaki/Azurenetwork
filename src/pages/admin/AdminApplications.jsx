import { useState } from 'react'
import { useApplications } from '../../hooks/useFirestore'
import { updateApplicationStatus } from '../../services/firestore'
import { formatDate } from '../../utils/date'
import { statusLabel, statusBadgeClass, APPLICATION_STATUS_LABELS } from '../../utils/status'
import Toast from '../../components/Toast'

const STALE_DAYS = 7

function daysSince(ts) {
  if (!ts) return 999
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export default function AdminApplications() {
  const { data: applications, loading } = useApplications()
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkStatus, setBulkStatus] = useState('')

  const filtered = applications.filter(app => {
    const name = (app.applicantName || '').toLowerCase()
    const title = (app.internshipTitle || '').toLowerCase()
    const school = (app.school || '').toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) ||
      title.includes(search.toLowerCase()) || school.includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || statusFilter === 'stale'
      ? true : app.status === statusFilter
    const matchStale = statusFilter === 'stale'
      ? (app.status === 'pending' || app.status === 'under_review') && daysSince(app.appliedDate) > STALE_DAYS
      : true
    return matchSearch && matchStatus && matchStale
  })

  const updateStatus = async (id, status) => {
    try {
      await updateApplicationStatus(id, status)
      setToast(`Status updated to ${statusLabel(status)}`)
    } catch (err) {
      setToast('Error: ' + err.message)
    }
  }

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return
    let count = 0
    for (const id of selectedIds) {
      try {
        await updateApplicationStatus(id, bulkStatus)
        count++
      } catch { /* continue */ }
    }
    setToast(`Updated ${count} applications to ${statusLabel(bulkStatus)}`)
    setSelectedIds(new Set())
    setBulkStatus('')
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(a => a.id)))
  }

  const staleCount = applications.filter(a =>
    (a.status === 'pending' || a.status === 'under_review') && daysSince(a.appliedDate) > STALE_DAYS
  ).length

  return (
    <div>
      <div className="page-header">
        <h1>All Applications</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          {filtered.length} {filtered.length === 1 ? 'application' : 'applications'}
        </span>
      </div>

      <div className="filter-bar">
        <input className="search-input" placeholder="Search by name, position, or school..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {staleCount > 0 && <option value="stale">🚨 Stale ({staleCount})</option>}
          {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => {
          const count = applications.filter(a => a.status === key).length
          if (count === 0 && !['pending', 'offered', 'offer_accepted'].includes(key)) return null
          return (
            <div key={key} className="stat-card" style={{ cursor: 'pointer', padding: 14 }}
              onClick={() => setStatusFilter(key)}>
              <div className="stat-label" style={{ fontSize: 11 }}>{label}</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{count}</div>
            </div>
          )
        })}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div style={{
          background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10,
          padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#4338ca' }}>
            {selectedIds.size} selected
          </span>
          <select className="filter-select" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 12 }}>
            <option value="">Change to...</option>
            {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button className="btn btn-sm btn-primary" onClick={handleBulkUpdate} disabled={!bulkStatus}>
            Apply
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => setSelectedIds(new Set())}>
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><p>Loading applications...</p></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll} />
                  </th>
                  <th>Applicant</th>
                  <th>Position</th>
                  <th>School</th>
                  <th>Applied</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--nriva-text-light)' }}>
                    No applications found.
                  </td></tr>
                )}
                {filtered.map(app => {
                  const age = daysSince(app.appliedDate)
                  const isStale = (app.status === 'pending' || app.status === 'under_review') && age > STALE_DAYS
                  return (
                    <tr key={app.id} style={{ background: isStale ? '#fef2f2' : undefined }}>
                      <td>
                        <input type="checkbox" checked={selectedIds.has(app.id)}
                          onChange={() => toggleSelect(app.id)} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{app.applicantName || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{app.email || '—'}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{app.internshipTitle || '—'}</td>
                      <td style={{ fontSize: 13 }}>{app.school || '—'}</td>
                      <td style={{ fontSize: 13 }}>{formatDate(app.appliedDate)}</td>
                      <td>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: isStale ? '#dc2626' : age > 3 ? '#ca8a04' : '#15803d',
                        }}>
                          {age}d
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${statusBadgeClass(app.status)}`}>
                          {statusLabel(app.status)}
                        </span>
                      </td>
                      <td>
                        <select className="form-control" aria-label="Change status"
                          style={{ padding: '4px 8px', fontSize: 11, minWidth: 110 }}
                          value={app.status || 'pending'}
                          onChange={(e) => updateStatus(app.id, e.target.value)}>
                          {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

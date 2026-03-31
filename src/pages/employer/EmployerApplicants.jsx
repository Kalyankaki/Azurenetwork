import { useState } from 'react'
import { sampleApplications } from '../../data'
import Toast from '../../components/Toast'

const statusOptions = ['pending', 'under_review', 'shortlisted', 'accepted', 'rejected']

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

export default function EmployerApplicants() {
  const [applicants, setApplicants] = useState(sampleApplications)
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = applicants.filter(app => {
    const matchStatus = filterStatus === 'all' || app.status === filterStatus
    const matchSearch = app.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      app.internshipTitle.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const updateStatus = (id, newStatus) => {
    setApplicants(applicants.map(a => a.id === id ? { ...a, status: newStatus } : a))
    setToast(`Applicant status updated to ${statusLabels[newStatus]}`)
    if (selected?.id === id) {
      setSelected({ ...selected, status: newStatus })
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Applicants</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          {filtered.length} applicants
        </span>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search by name or position..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {statusOptions.map(s => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Position</th>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: '#e8eaf6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, color: 'var(--nriva-primary)', fontSize: 13,
                      }}>
                        {app.applicantName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{app.applicantName}</div>
                        <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{app.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{app.internshipTitle}</td>
                  <td style={{ fontSize: 13 }}>{app.university}</td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{app.gpa}</td>
                  <td style={{ fontSize: 13 }}>{new Date(app.appliedDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${statusBadgeClass[app.status]}`}>
                      {statusLabels[app.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => setSelected(app)}>View</button>
                      {app.status !== 'accepted' && app.status !== 'rejected' && (
                        <button className="btn btn-sm btn-success" onClick={() => updateStatus(app.id, 'shortlisted')}>
                          Shortlist
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h2>Applicant Profile</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: '#e8eaf6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'var(--nriva-primary)', fontSize: 20,
                }}>
                  {selected.applicantName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600 }}>{selected.applicantName}</h3>
                  <p style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
                    Applied for: {selected.internshipTitle}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
                padding: '16px 0', borderTop: '1px solid var(--nriva-border)', borderBottom: '1px solid var(--nriva-border)',
                marginBottom: 20,
              }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Email</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Phone</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>University</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.university}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Major</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.major}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Graduation</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.graduationYear}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>GPA</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.gpa}</div>
                </div>
              </div>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Cover Letter</h4>
              <p style={{ fontSize: 14, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 20 }}>
                {selected.coverLetter}
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Resume</h4>
              <div style={{
                padding: '12px 16px', border: '1px solid var(--nriva-border)', borderRadius: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 14 }}>📎 {selected.resume}</span>
                <button className="btn btn-sm btn-outline">Download</button>
              </div>

              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Update Status</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {statusOptions.map(s => (
                    <button
                      key={s}
                      className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => updateStatus(selected.id, s)}
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

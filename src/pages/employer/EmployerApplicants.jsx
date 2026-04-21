import { useState } from 'react'
import { useApplications } from '../../hooks/useFirestore'
import { updateApplicationStatus } from '../../services/firestore'
import { formatDate } from '../../utils/date'
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
  const { data: applicants } = useApplications()
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = applicants.filter(app => {
    const matchStatus = filterStatus === 'all' || app.status === filterStatus
    const name = (app.applicantName || '').toLowerCase()
    const title = (app.internshipTitle || '').toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) || title.includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const updateStatus = async (id, newStatus) => {
    try {
      await updateApplicationStatus(id, newStatus)
      setToast(`Applicant status updated to ${statusLabels[newStatus]}`)
      if (selected?.id === id) {
        setSelected({ ...selected, status: newStatus })
      }
    } catch (err) {
      setToast('Error: ' + err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Applicants</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          {filtered.length} {filtered.length === 1 ? 'applicant' : 'applicants'}
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--nriva-text-light)' }}>
                    No applicants found.
                  </td>
                </tr>
              )}
              {filtered.map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: '#e8eaf6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, color: 'var(--nriva-primary)', fontSize: 13,
                      }}>
                        {(app.applicantName || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{app.applicantName || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{app.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{app.internshipTitle || '—'}</td>
                  <td style={{ fontSize: 13 }}>{app.school || app.university || '—'}</td>
                  <td style={{ fontSize: 13 }}>{app.gradeLevel || '—'}</td>
                  <td style={{ fontSize: 13 }}>{formatDate(app.appliedDate)}</td>
                  <td>
                    <span className={`badge badge-${statusBadgeClass[app.status] || 'pending'}`}>
                      {statusLabels[app.status] || 'Pending'}
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
              <button onClick={() => setSelected(null)} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: '#e8eaf6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'var(--nriva-primary)', fontSize: 20,
                }}>
                  {(selected.applicantName || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600 }}>{selected.applicantName || '—'}</h3>
                  <p style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
                    Applied for: {selected.internshipTitle || '—'}
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
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.email || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Phone</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.phone || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>School</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.school || selected.university || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Major</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.major || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Grade Level</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.gradeLevel || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>GPA</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.gpa || '—'}</div>
                </div>
                {selected.chapter && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>NRIVA Chapter</div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.chapter}</div>
                  </div>
                )}
                {selected.availability && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Availability</div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.availability.replace('_', ' ')}</div>
                  </div>
                )}
              </div>

              {selected.skills && (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Skills</h4>
                  <p style={{ fontSize: 14, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 16 }}>
                    {selected.skills}
                  </p>
                </>
              )}

              {selected.experience && (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Prior Experience</h4>
                  <p style={{ fontSize: 14, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 16 }}>
                    {selected.experience}
                  </p>
                </>
              )}

              {selected.whyInterested && (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Why Interested</h4>
                  <p style={{ fontSize: 14, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 20 }}>
                    {selected.whyInterested}
                  </p>
                </>
              )}

              {selected.resumeUrl && (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Resume</h4>
                  <a href={selected.resumeUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', background: '#e8eaf6', color: 'var(--nriva-primary)',
                      borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16,
                    }}>
                    📎 {selected.resumeName || 'Download Resume'}
                  </a>
                </>
              )}

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

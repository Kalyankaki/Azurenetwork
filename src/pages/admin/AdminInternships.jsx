import { useState } from 'react'
import { useInternships } from '../../hooks/useFirestore'
import { updateInternship as updateInternshipDB, deleteInternship as deleteInternshipDB } from '../../services/firestore'
import Toast from '../../components/Toast'
import { formatDate } from '../../utils/date'

export default function AdminInternships() {
  const { data: internships } = useInternships()
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = internships.filter(job => {
    const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || job.status === statusFilter
    return matchSearch && matchStatus
  })

  const updateStatus = async (id, status) => {
    try {
      await updateInternshipDB(id, { status })
      setToast(`Internship status updated to ${status}`)
    } catch (err) {
      setToast('Error: ' + err.message)
    }
  }

  const [confirmDelete, setConfirmDelete] = useState(null)

  const deletePosting = async (id) => {
    try {
      await deleteInternshipDB(id)
      setSelected(null)
      setConfirmDelete(null)
      setToast('Internship posting removed')
    } catch (err) {
      setToast('Error: ' + err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Manage Internships</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          {filtered.length} total postings
        </span>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search by title or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="filled">Filled</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Employer</th>
                <th>Location</th>
                <th>Type</th>
                <th>Applicants</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{job.company}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{job.employer}</td>
                  <td style={{ fontSize: 13 }}>{job.location}</td>
                  <td style={{ fontSize: 13 }}>{job.type}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{job.applicants}</span>
                    <span style={{ color: 'var(--nriva-text-light)' }}> / {job.positions}</span>
                  </td>
                  <td><span className={`badge badge-${job.status}`}>{job.status}</span></td>
                  <td style={{ fontSize: 13 }}>{formatDate(job.deadline)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => setSelected(job)}>
                        Manage
                      </button>
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
              <h2>Manage Internship</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{selected.title}</h3>
              <p style={{ color: 'var(--nriva-text-light)', marginBottom: 20 }}>
                {selected.company} · Posted by {selected.employer}
              </p>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
                padding: '16px 0', borderTop: '1px solid var(--nriva-border)', borderBottom: '1px solid var(--nriva-border)',
                marginBottom: 20,
              }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Location</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.location}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Duration</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.duration}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Stipend</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.stipend}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Type</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Positions</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.positions}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Applicants</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.applicants}</div>
                </div>
              </div>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Description</h4>
              <p style={{ fontSize: 14, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 16 }}>
                {selected.description}
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Requirements</h4>
              <p style={{ fontSize: 14, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 20 }}>
                {selected.requirements}
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Update Status</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {['open', 'closed', 'filled'].map(s => (
                  <button
                    key={s}
                    className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => {
                      updateStatus(selected.id, s)
                      setSelected({ ...selected, status: s })
                    }}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected.id)}>
                Remove Posting
              </button>
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Confirm Removal</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove this internship posting? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deletePosting(confirmDelete)}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

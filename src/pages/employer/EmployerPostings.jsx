import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships } from '../../hooks/useFirestore'
import { updateInternship } from '../../services/firestore'
import Toast from '../../components/Toast'

export default function EmployerPostings() {
  const { user } = useAuth()
  const { data: postings } = useInternships({ employerUid: user?.uid })
  const [toast, setToast] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const toggleStatus = async (id) => {
    const posting = postings.find(p => p.id === id)
    if (!posting) return
    const newStatus = posting.status === 'open' ? 'closed' : 'open'
    try {
      await updateInternship(id, { status: newStatus })
      setToast('Posting status updated!')
    } catch (err) {
      setToast('Error: ' + err.message)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Internship Postings</h1>
        <Link to="/employer/new-posting" className="btn btn-primary">
          + Post New Internship
        </Link>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Location</th>
                <th>Type</th>
                <th>Applicants</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {postings.map(job => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{job.company}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{job.location}</td>
                  <td style={{ fontSize: 13 }}>{job.type}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{job.applicants}</span>
                    <span style={{ color: 'var(--nriva-text-light)' }}> / {job.positions} positions</span>
                  </td>
                  <td><span className={`badge badge-${job.status}`}>{job.status}</span></td>
                  <td style={{ fontSize: 13 }}>{new Date(job.deadline).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setEditingId(editingId === job.id ? null : job.id)}
                      >
                        Edit
                      </button>
                      <button
                        className={`btn btn-sm ${job.status === 'open' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleStatus(job.id)}
                      >
                        {job.status === 'open' ? 'Close' : 'Reopen'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingId && (
        <div className="modal-overlay" onClick={() => setEditingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Posting</h2>
              <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              {(() => {
                const job = postings.find(p => p.id === editingId)
                if (!job) return null
                return (
                  <>
                    <div className="form-group">
                      <label>Position Title</label>
                      <input className="form-control" defaultValue={job.title} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Location</label>
                        <input className="form-control" defaultValue={job.location} />
                      </div>
                      <div className="form-group">
                        <label>Duration</label>
                        <input className="form-control" defaultValue={job.duration} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Stipend</label>
                        <input className="form-control" defaultValue={job.stipend} />
                      </div>
                      <div className="form-group">
                        <label>Positions</label>
                        <input className="form-control" type="number" defaultValue={job.positions} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea className="form-control" defaultValue={job.description} />
                    </div>
                    <div className="form-group">
                      <label>Application Deadline</label>
                      <input className="form-control" type="date" defaultValue={job.deadline} />
                    </div>
                  </>
                )
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setEditingId(null); setToast('Posting updated successfully!') }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

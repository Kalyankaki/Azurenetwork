import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships } from '../../hooks/useFirestore'
import { updateInternship } from '../../services/firestore'
import { formatDate, isPastDate } from '../../utils/date'
import Toast from '../../components/Toast'

export default function EmployerPostings() {
  const { user } = useAuth()
  const { data: postings, loading } = useInternships({ employerUid: user?.uid })
  const [toast, setToast] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingId) {
      const job = postings.find(p => p.id === editingId)
      if (job) {
        setEditForm({
          title: job.title || '',
          location: job.location || '',
          duration: job.duration || '',
          stipend: job.stipend || '',
          positions: job.positions || 1,
          description: job.description || '',
          deadline: job.deadline || '',
        })
      }
    } else {
      setEditForm(null)
    }
  }, [editingId, postings])

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

  const saveEdit = async () => {
    if (!editForm || !editingId) return
    if (editForm.deadline && isPastDate(editForm.deadline)) {
      setToast('Deadline cannot be in the past')
      return
    }
    setSaving(true)
    try {
      await updateInternship(editingId, {
        title: editForm.title,
        location: editForm.location,
        duration: editForm.duration,
        stipend: editForm.stipend,
        positions: parseInt(editForm.positions) || 1,
        description: editForm.description,
        deadline: editForm.deadline,
      })
      setToast('Posting updated successfully!')
      setEditingId(null)
    } catch (err) {
      setToast('Error: ' + err.message)
    } finally {
      setSaving(false)
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

      {loading ? (
        <div className="empty-state"><p>Loading postings...</p></div>
      ) : postings.length === 0 ? (
        <div className="empty-state">
          <h3>No postings yet</h3>
          <p>Create your first internship posting to get started.</p>
          <Link to="/employer/new-posting" className="btn btn-primary" style={{ marginTop: 16 }}>
            + Post New Internship
          </Link>
        </div>
      ) : (
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
                      <div style={{ fontWeight: 500 }}>{job.title || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{job.company || '—'}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{job.location || '—'}</td>
                    <td style={{ fontSize: 13 }}>{job.type || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{job.applicants || 0}</span>
                      <span style={{ color: 'var(--nriva-text-light)' }}> / {job.positions || 0} {(job.positions || 0) === 1 ? 'position' : 'positions'}</span>
                    </td>
                    <td><span className={`badge badge-${job.status || 'open'}`}>{job.status || 'open'}</span></td>
                    <td style={{ fontSize: 13 }}>{formatDate(job.deadline)}</td>
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
      )}

      {editingId && editForm && (
        <div className="modal-overlay" onClick={() => setEditingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Posting</h2>
              <button onClick={() => setEditingId(null)} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Position Title</label>
                <input className="form-control" value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input className="form-control" value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input className="form-control" value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stipend</label>
                  <input className="form-control" value={editForm.stipend}
                    onChange={(e) => setEditForm({ ...editForm, stipend: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Positions</label>
                  <input className="form-control" type="number" min="1" value={editForm.positions}
                    onChange={(e) => setEditForm({ ...editForm, positions: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Application Deadline</label>
                <input className="form-control" type="date" value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditingId(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

import { useState, useMemo } from 'react'
import { useInternships, useApplications } from '../../hooks/useFirestore'
import { useAuth } from '../../contexts/AuthContext'
import {
  updateInternship as updateInternshipDB,
  deleteInternship as deleteInternshipDB,
  approveInternship, rejectInternship, INTERNSHIP_STATUSES,
} from '../../services/firestore'
import { formatDate } from '../../utils/date'
import Toast from '../../components/Toast'

export default function AdminInternships() {
  const { user } = useAuth()
  const { data: internships } = useInternships()
  const { data: allApplications } = useApplications()
  const appCountMap = {}
  allApplications.forEach(a => { appCountMap[a.internshipId] = (appCountMap[a.internshipId] || 0) + 1 })
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [employerFilter, setEmployerFilter] = useState('all')
  const [sortField, setSortField] = useState('deadline')
  const [sortDir, setSortDir] = useState('asc')
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Unique values for filters
  const locations = useMemo(() => [...new Set(internships.map(i => i.location).filter(Boolean))].sort(), [internships])
  const types = useMemo(() => [...new Set(internships.map(i => i.type).filter(Boolean))].sort(), [internships])
  const employers = useMemo(() => [...new Set(internships.map(i => i.employerName || i.employer).filter(Boolean))].sort(), [internships])

  const filtered = useMemo(() => {
    let result = internships.filter(job => {
      const q = search.toLowerCase()
      const matchSearch = !q || (job.title || '').toLowerCase().includes(q) ||
        (job.company || '').toLowerCase().includes(q) ||
        (job.employerName || job.employer || '').toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || job.status === statusFilter
      const matchLocation = locationFilter === 'all' || job.location === locationFilter
      const matchType = typeFilter === 'all' || job.type === typeFilter
      const matchEmployer = employerFilter === 'all' || (job.employerName || job.employer) === employerFilter
      return matchSearch && matchStatus && matchLocation && matchType && matchEmployer
    })

    // Sort
    result.sort((a, b) => {
      let va, vb
      switch (sortField) {
        case 'title': va = (a.title || '').toLowerCase(); vb = (b.title || '').toLowerCase(); break
        case 'company': va = (a.company || '').toLowerCase(); vb = (b.company || '').toLowerCase(); break
        case 'employer': va = (a.employerName || a.employer || '').toLowerCase(); vb = (b.employerName || b.employer || '').toLowerCase(); break
        case 'location': va = (a.location || ''); vb = (b.location || ''); break
        case 'type': va = (a.type || ''); vb = (b.type || ''); break
        case 'applicants': va = appCountMap[a.id] || 0; vb = appCountMap[b.id] || 0; break
        case 'positions': va = a.positions || 0; vb = b.positions || 0; break
        case 'status': va = (a.status || ''); vb = (b.status || ''); break
        case 'deadline': va = a.deadline || ''; vb = b.deadline || ''; break
        case 'startDate': va = a.startDate || ''; vb = b.startDate || ''; break
        default: va = a.deadline || ''; vb = b.deadline || ''
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [internships, search, statusFilter, locationFilter, typeFilter, employerFilter, sortField, sortDir, appCountMap])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }
  const sortIcon = (field) => sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  const pendingCount = internships.filter(i => i.status === INTERNSHIP_STATUSES.PENDING_APPROVAL).length

  const updateStatus = async (id, status) => {
    try {
      await updateInternshipDB(id, { status })
      setToast(`Status updated to ${status}`)
    } catch (err) { setToast('Error: ' + err.message) }
  }

  const handleApprove = async (id) => {
    try {
      await approveInternship(id, user?.email || '')
      setToast('Internship approved and now visible to students')
      if (selected?.id === id) setSelected({ ...selected, status: INTERNSHIP_STATUSES.OPEN })
    } catch (err) { setToast('Error: ' + err.message) }
  }

  const handleReject = async () => {
    if (!rejectingId) return
    try {
      await rejectInternship(rejectingId, rejectReason.trim(), user?.email || '')
      setToast('Internship rejected')
      setRejectingId(null)
      setRejectReason('')
      setSelected(null)
    } catch (err) { setToast('Error: ' + err.message) }
  }

  const deletePosting = async (id) => {
    try {
      await deleteInternshipDB(id)
      setSelected(null)
      setConfirmDelete(null)
      setToast('Internship posting removed')
    } catch (err) { setToast('Error: ' + err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Manage Internships</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          {filtered.length} total postings
        </span>
      </div>

      {pendingCount > 0 && (
        <div style={{
          background: '#fffbeb', border: '2px solid #fbbf24', borderRadius: 12,
          padding: '14px 20px', marginBottom: 16, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>⏳</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {pendingCount} internship{pendingCount === 1 ? '' : 's'} awaiting approval
              </div>
              <div style={{ fontSize: 13, color: '#92400e' }}>
                Review and approve before they become visible to students
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm"
            onClick={() => setStatusFilter(INTERNSHIP_STATUSES.PENDING_APPROVAL)}>
            Review Now
          </button>
        </div>
      )}

      <div className="filter-bar">
        <input className="search-input" placeholder="Search by title, company, or employer..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value={INTERNSHIP_STATUSES.PENDING_APPROVAL}>Pending Approval</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="filled">Filled</option>
          <option value={INTERNSHIP_STATUSES.REJECTED}>Rejected</option>
        </select>
        <select className="filter-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
          <option value="all">All Locations</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={employerFilter} onChange={(e) => setEmployerFilter(e.target.value)}>
          <option value="all">All Employers</option>
          {employers.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('title')}>Position{sortIcon('title')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('employer')}>Employer{sortIcon('employer')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('location')}>Location{sortIcon('location')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('type')}>Type{sortIcon('type')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('applicants')}>Applicants{sortIcon('applicants')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('positions')}>Positions{sortIcon('positions')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('status')}>Status{sortIcon('status')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('startDate')}>Start Date{sortIcon('startDate')}</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('deadline')}>Deadline{sortIcon('deadline')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--nriva-text-light)' }}>
                  No internships found.
                </td></tr>
              )}
              {filtered.map(job => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{job.title || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{job.company || '—'}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{job.employerName || job.employer || '—'}</td>
                  <td style={{ fontSize: 13 }}>{job.location || '—'}</td>
                  <td style={{ fontSize: 13 }}>{job.type || '—'}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{appCountMap[job.id] || 0}</td>
                  <td style={{ fontSize: 13 }}>{job.positions || 0}</td>
                  <td>
                    <span className={`badge badge-${
                      job.status === INTERNSHIP_STATUSES.PENDING_APPROVAL ? 'pending' :
                      job.status === INTERNSHIP_STATUSES.REJECTED ? 'closed' :
                      job.status || 'open'
                    }`}>
                      {job.status === INTERNSHIP_STATUSES.PENDING_APPROVAL ? 'Pending' :
                        (job.status || 'open')}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{formatDate(job.startDate) !== '—' ? formatDate(job.startDate) : '—'}</td>
                  <td style={{ fontSize: 13 }}>{formatDate(job.deadline)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {job.status === INTERNSHIP_STATUSES.PENDING_APPROVAL && (
                        <>
                          <button className="btn btn-sm btn-success"
                            onClick={() => handleApprove(job.id)}>Approve</button>
                          <button className="btn btn-sm btn-danger"
                            onClick={() => setRejectingId(job.id)}>Reject</button>
                        </>
                      )}
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
              <button onClick={() => setSelected(null)} aria-label="Close"
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{selected.title}</h3>
              <p style={{ color: 'var(--nriva-text-light)', marginBottom: 20 }}>
                {selected.company} · Posted by {selected.employerName || selected.employer || 'Unknown'}
              </p>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
                padding: '16px 0', borderTop: '1px solid var(--nriva-border)',
                borderBottom: '1px solid var(--nriva-border)', marginBottom: 20,
              }}>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Location</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.location || '—'}</div></div>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Duration</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.duration || '—'}</div></div>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Stipend</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.stipend || '—'}</div></div>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Type</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.type || '—'}</div></div>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Positions</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.positions || 0}</div></div>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Applicants</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{appCountMap[selected.id] || 0}</div></div>
              </div>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Description</h4>
              <p style={{ fontSize: 14, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                {selected.description || 'No description provided.'}
              </p>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Requirements</h4>
              <p style={{ fontSize: 14, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 20, whiteSpace: 'pre-wrap' }}>
                {selected.requirements || 'No requirements specified.'}
              </p>

              {selected.rejectionReason && (
                <div style={{ background: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
                  <strong>Rejection Reason:</strong> {selected.rejectionReason}
                </div>
              )}

              {selected.status === INTERNSHIP_STATUSES.PENDING_APPROVAL && (
                <div style={{ background: '#fffbeb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#92400e' }}>
                  <strong>This internship is awaiting your approval.</strong> Students cannot see it until you approve.
                </div>
              )}

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Update Status</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {['open', 'closed', 'filled'].map(s => (
                  <button key={s}
                    className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => { updateStatus(selected.id, s); setSelected({ ...selected, status: s }) }}
                    style={{ textTransform: 'capitalize' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              {selected.status === INTERNSHIP_STATUSES.PENDING_APPROVAL && (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => handleApprove(selected.id)}>
                    Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setRejectingId(selected.id)}>
                    Reject
                  </button>
                </>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selected.id)}>
                Remove Posting
              </button>
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {rejectingId && (
        <div className="modal-overlay" onClick={() => setRejectingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header"><h2>Reject Internship</h2></div>
            <div className="modal-body">
              <p style={{ fontSize: 14, marginBottom: 12 }}>
                Provide a reason for rejection (optional but recommended):
              </p>
              <textarea className="form-control" value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Description too vague, compensation not specified, not appropriate for youth program..."
                style={{ minHeight: 100 }} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setRejectingId(null); setRejectReason('') }}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header"><h2>Confirm Removal</h2></div>
            <div className="modal-body">
              <p>Are you sure you want to remove this internship posting? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deletePosting(confirmDelete)}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

import { useState } from 'react'
import { useMessages } from '../../hooks/useFirestore'
import { updateMessageStatus } from '../../services/firestore'
import { formatDate } from '../../utils/date'
import Toast from '../../components/Toast'

const categoryLabels = {
  general: 'General',
  issue: 'Issue',
  feedback: 'Feedback',
  access: 'Access Request',
}

const statusColors = {
  open: { bg: '#fff7ed', color: '#c2410c', label: 'Open' },
  in_progress: { bg: '#eff6ff', color: '#1d4ed8', label: 'In Progress' },
  resolved: { bg: '#f0fdf4', color: '#15803d', label: 'Resolved' },
}

export default function AdminMessages() {
  const { data: messages, loading } = useMessages()
  const [toast, setToast] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [adminNote, setAdminNote] = useState('')

  const filtered = messages
    .filter(m => filterStatus === 'all' || m.status === filterStatus)
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0
      const bTime = b.createdAt?.seconds || 0
      return bTime - aTime
    })

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateMessageStatus(id, newStatus, adminNote)
      setToast(`Message marked as ${statusColors[newStatus]?.label || newStatus}`)
      setAdminNote('')
      if (selected?.id === id) setSelected({ ...selected, status: newStatus })
    } catch (err) {
      setToast('Error: ' + err.message)
    }
  }

  const openCount = messages.filter(m => m.status === 'open').length
  const resolvedCount = messages.filter(m => m.status === 'resolved').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Messages & Issues</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            Messages from interns and employers
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: '#fff7ed', padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>
            <strong style={{ color: '#c2410c' }}>{openCount}</strong> <span style={{ color: '#9a3412' }}>open</span>
          </div>
          <div style={{ background: '#f0fdf4', padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>
            <strong style={{ color: '#15803d' }}>{resolvedCount}</strong> <span style={{ color: '#166534' }}>resolved</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ maxWidth: 200 }}>
          <option value="all">All Messages</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading messages...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p>No messages found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(msg => {
            const sc = statusColors[msg.status] || statusColors.open
            return (
              <div key={msg.id} className="card" style={{ padding: '16px 20px', cursor: 'pointer' }}
                onClick={() => setSelected(msg)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        background: sc.bg, color: sc.color,
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      }}>{sc.label}</span>
                      <span style={{
                        background: '#f1f5f9', color: '#475569',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11,
                      }}>{categoryLabels[msg.category] || msg.category}</span>
                      <span style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>
                        from {msg.senderName} ({msg.senderRole})
                      </span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{msg.subject}</h3>
                    <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', lineHeight: 1.4 }}>
                      {msg.message.length > 150 ? msg.message.substring(0, 150) + '...' : msg.message}
                    </p>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', whiteSpace: 'nowrap' }}>
                    {formatDate(msg.createdAt)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setAdminNote('') }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>{selected.subject}</h2>
              <button onClick={() => { setSelected(null); setAdminNote('') }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{
                  background: (statusColors[selected.status] || statusColors.open).bg,
                  color: (statusColors[selected.status] || statusColors.open).color,
                  padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                }}>{(statusColors[selected.status] || statusColors.open).label}</span>
                <span style={{ background: '#f1f5f9', padding: '3px 10px', borderRadius: 6, fontSize: 12 }}>
                  {categoryLabels[selected.category] || selected.category}
                </span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 16 }}>
                <strong>From:</strong> {selected.senderName} ({selected.senderEmail})<br />
                <strong>Role:</strong> {selected.senderRole}<br />
                <strong>Date:</strong> {formatDate(selected.createdAt)}
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
                {selected.message}
              </div>

              {selected.adminNote && (
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
                  <strong>Admin Note:</strong> {selected.adminNote}
                </div>
              )}

              {selected.status !== 'resolved' && (
                <div className="form-group">
                  <label>Admin Note (optional)</label>
                  <textarea className="form-control" value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add a note about the resolution..." style={{ minHeight: 60 }} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selected.status === 'open' && (
                <button className="btn btn-outline" onClick={() => handleStatusChange(selected.id, 'in_progress')}>
                  Mark In Progress
                </button>
              )}
              {selected.status !== 'resolved' && (
                <button className="btn btn-primary" onClick={() => handleStatusChange(selected.id, 'resolved')}>
                  Mark Resolved
                </button>
              )}
              {selected.status === 'resolved' && (
                <button className="btn btn-outline" onClick={() => handleStatusChange(selected.id, 'open')}>
                  Reopen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

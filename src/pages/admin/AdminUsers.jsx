import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useUsers } from '../../hooks/useFirestore'
import { updateUserRoles, updateUserCoordinator, isSuperAdmin } from '../../services/firestore'
import Toast from '../../components/Toast'

const ALL_ROLES = ['intern', 'employer', 'admin']

export default function AdminUsers() {
  const { data: users, loading } = useUsers()
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [coordinatorModal, setCoordinatorModal] = useState(null)
  const [coordForm, setCoordForm] = useState({ name: '', email: '', phone: '' })

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleRole = async (user, role) => {
    if (isSuperAdmin(user.email)) return
    const currentRoles = user.roles || []
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role]
    try {
      await updateUserRoles(user.id, newRoles)
      setToast(`Updated roles for ${user.displayName || user.email}`)
    } catch (err) {
      setToast(`Error: ${err.message}`)
    }
  }

  const handleConfirmedToggle = () => {
    if (confirmAction) {
      toggleRole(confirmAction.user, confirmAction.role)
      setConfirmAction(null)
    }
  }

  const openCoordinatorModal = (user) => {
    setCoordinatorModal(user)
    setCoordForm(user.coordinator || { name: '', email: '', phone: '' })
  }

  const saveCoordinator = async () => {
    if (!coordinatorModal) return
    try {
      const coord = coordForm.name.trim()
        ? { name: coordForm.name.trim(), email: coordForm.email.trim(), phone: coordForm.phone.trim() }
        : null
      await updateUserCoordinator(coordinatorModal.id, coord)
      setToast(`Coordinator ${coord ? 'assigned' : 'removed'} for ${coordinatorModal.displayName || coordinatorModal.email}`)
      setCoordinatorModal(null)
    } catch (err) {
      setToast(`Error: ${err.message}`)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Manage Users</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            Assign roles and NRIVA Coordinators
          </p>
        </div>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>{filtered.length} users</span>
      </div>

      <div style={{
        background: '#e8eaf6', borderRadius: 'var(--nriva-radius)',
        padding: '14px 20px', marginBottom: 20, fontSize: 13, color: 'var(--nriva-primary)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <span>
          Assign roles to grant portal access. Set an <strong>NRIVA Coordinator</strong> (youth committee volunteer) for each user to serve as their liaison.
        </span>
      </div>

      <div className="filter-bar">
        <input className="search-input" placeholder="Search by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading users...</p></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>User</th><th>Roles</th><th>NRIVA Coordinator</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--nriva-text-light)' }}>
                    {search ? 'No users match your search.' : 'No users have signed in yet.'}
                  </td></tr>
                )}
                {filtered.map(user => {
                  const isSuper = isSuperAdmin(user.email)
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                          ) : (
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', background: '#e8eaf6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 600, color: 'var(--nriva-primary)', fontSize: 13,
                            }}>
                              {(user.displayName || user.email || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 14 }}>
                              {user.displayName || 'Unknown'}
                              {isSuper && (
                                <span style={{
                                  marginLeft: 8, fontSize: 10, background: '#ff6f00', color: 'white',
                                  padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                                }}>SUPER ADMIN</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {ALL_ROLES.map(role => {
                            const hasRole = isSuper || (user.roles || []).includes(role)
                            return (
                              <button key={role}
                                onClick={() => {
                                  if (isSuper) return
                                  if (hasRole && role === 'admin') setConfirmAction({ user, role })
                                  else toggleRole(user, role)
                                }}
                                disabled={isSuper}
                                style={{
                                  padding: '4px 12px', borderRadius: 6,
                                  border: hasRole ? 'none' : '1px solid var(--nriva-border)',
                                  background: hasRole
                                    ? role === 'admin' ? '#b71c1c' : role === 'employer' ? '#1b5e20' : '#1a237e'
                                    : 'transparent',
                                  color: hasRole ? 'white' : 'var(--nriva-text-light)',
                                  fontSize: 12, fontWeight: 500, textTransform: 'capitalize',
                                  cursor: isSuper ? 'default' : 'pointer',
                                  opacity: isSuper ? 0.7 : 1, transition: 'all 0.2s',
                                }}
                              >{role}</button>
                            )
                          })}
                        </div>
                      </td>
                      <td>
                        {user.coordinator ? (
                          <div style={{ fontSize: 13 }}>
                            <div style={{ fontWeight: 500 }}>{user.coordinator.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>{user.coordinator.email}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Not assigned</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => openCoordinatorModal(user)}
                          style={{ fontSize: 11, padding: '3px 10px' }}>
                          {user.coordinator ? 'Edit' : 'Assign'} Coordinator
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coordinator Assignment Modal */}
      {coordinatorModal && (
        <div className="modal-overlay" onClick={() => setCoordinatorModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>Assign NRIVA Coordinator</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 16 }}>
                Assign a youth committee volunteer as coordinator for <strong>{coordinatorModal.displayName || coordinatorModal.email}</strong>
              </p>
              <div className="form-group">
                <label>Coordinator Name</label>
                <input className="form-control" value={coordForm.name} onChange={(e) => setCoordForm({ ...coordForm, name: e.target.value })}
                  placeholder="e.g., Priya Sharma" />
              </div>
              <div className="form-group">
                <label>Coordinator Email</label>
                <input className="form-control" type="email" value={coordForm.email} onChange={(e) => setCoordForm({ ...coordForm, email: e.target.value })}
                  placeholder="coordinator@nriva.org" />
              </div>
              <div className="form-group">
                <label>Coordinator Phone</label>
                <input className="form-control" type="tel" value={coordForm.phone} onChange={(e) => setCoordForm({ ...coordForm, phone: e.target.value })}
                  placeholder="(555) 123-4567" />
              </div>
            </div>
            <div className="modal-footer">
              {coordinatorModal.coordinator && (
                <button className="btn btn-outline" style={{ color: 'var(--nriva-danger)', borderColor: 'var(--nriva-danger)' }}
                  onClick={() => { setCoordForm({ name: '', email: '', phone: '' }); saveCoordinator() }}>
                  Remove
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setCoordinatorModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveCoordinator}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm role removal */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header"><h2>Confirm Role Change</h2></div>
            <div className="modal-body">
              <p>Remove the <strong>{confirmAction.role}</strong> role from <strong>{confirmAction.user.displayName || confirmAction.user.email}</strong>?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirmedToggle}>Remove Role</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useUsers } from '../../hooks/useFirestore'
import { updateUserRoles, updateUserCoordinator, deleteUser, isSuperAdmin } from '../../services/firestore'
import Toast from '../../components/Toast'

const ALL_ROLES = ['intern', 'employer', 'admin']

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const { data: users, loading, error, retry } = useUsers()
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [confirmAction, setConfirmAction] = useState(null)
  const [coordinatorModal, setCoordinatorModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [coordForm, setCoordForm] = useState({ name: '', email: '', phone: '' })

  // Unique locations from user school/chapter fields
  const userLocations = [...new Set(users.map(u => u.school || u.chapter).filter(Boolean))].sort()

  // Sort: pending users (no roles) first, then by createdAt desc
  const sorted = [...users].sort((a, b) => {
    const aHasRoles = (a.roles || []).length > 0 || isSuperAdmin(a.email)
    const bHasRoles = (b.roles || []).length > 0 || isSuperAdmin(b.email)
    if (aHasRoles !== bHasRoles) return aHasRoles ? 1 : -1
    const aTime = a.createdAt?.seconds || 0
    const bTime = b.createdAt?.seconds || 0
    return bTime - aTime
  })

  const filtered = sorted.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || (u.email || '').toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.school || '').toLowerCase().includes(q)
    const matchRole = roleFilter === 'all' ||
      (roleFilter === 'none' ? !(u.roles || []).length : (u.roles || []).includes(roleFilter))
    const matchLocation = locationFilter === 'all' ||
      (u.school || u.chapter || '') === locationFilter
    return matchSearch && matchRole && matchLocation
  })

  const toggleRole = async (user, role) => {
    if (isSuperAdmin(user.email)) return
    const currentRoles = user.roles || []
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role]
    try {
      await updateUserRoles(user.id, newRoles, currentUser?.email || '')
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
        <input className="search-input" placeholder="Search by name, email, or school..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="intern">Interns</option>
          <option value="employer">Employers</option>
          <option value="admin">Admins</option>
          <option value="none">No Role</option>
        </select>
        {userLocations.length > 0 && (
          <select className="filter-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option value="all">All Locations</option>
            {userLocations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: '16px 20px', marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 13, color: '#b91c1c' }}>
            <strong>Failed to load users:</strong> {error}
          </div>
          <button className="btn btn-sm btn-outline" onClick={retry} style={{ whiteSpace: 'nowrap' }}>
            Retry
          </button>
        </div>
      )}

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
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => openCoordinatorModal(user)}
                            style={{ fontSize: 11, padding: '3px 10px' }}>
                            {user.coordinator ? 'Edit' : 'Assign'} Coordinator
                          </button>
                          {!isSuper && (
                            <button className="btn btn-sm btn-outline" onClick={() => setDeleteConfirm(user)}
                              style={{ fontSize: 11, padding: '3px 10px', color: 'var(--nriva-danger)', borderColor: 'var(--nriva-danger)' }}>
                              Delete
                            </button>
                          )}
                        </div>
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
                Select a coordinator for <strong>{coordinatorModal.displayName || coordinatorModal.email}</strong>
              </p>
              <div className="form-group">
                <label>Select Coordinator</label>
                <select className="form-control"
                  value={coordForm.name ? `${coordForm.name}|||${coordForm.email}` : ''}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setCoordForm({ name: '', email: '', phone: '' })
                      return
                    }
                    const [name, email] = e.target.value.split('|||')
                    const adminUser = users.find(u => u.email === email)
                    setCoordForm({ name, email, phone: adminUser?.phone || '' })
                  }}>
                  <option value="">Select a coordinator...</option>
                  {users
                    .filter(u => isSuperAdmin(u.email) || (u.roles || []).includes('admin'))
                    .map(u => (
                      <option key={u.id} value={`${u.displayName || u.email}|||${u.email}`}>
                        {u.displayName || u.email}{isSuperAdmin(u.email) ? ' (Super Admin)' : ' (Admin)'}
                      </option>
                    ))}
                </select>
              </div>
              {coordForm.name && (
                <>
                  <div style={{
                    background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8,
                    padding: '12px 16px', marginBottom: 12,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0369a1' }}>{coordForm.name}</div>
                    <div style={{ fontSize: 13, color: '#0284c7' }}>{coordForm.email}</div>
                  </div>
                  <div className="form-group">
                    <label>Phone (optional)</label>
                    <input className="form-control" type="tel" value={coordForm.phone}
                      onChange={(e) => setCoordForm({ ...coordForm, phone: e.target.value })}
                      placeholder="(555) 123-4567" />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {coordinatorModal.coordinator && (
                <button className="btn btn-outline" style={{ color: 'var(--nriva-danger)', borderColor: 'var(--nriva-danger)' }}
                  onClick={() => { setCoordForm({ name: '', email: '', phone: '' }); saveCoordinator() }}>
                  Remove
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setCoordinatorModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveCoordinator} disabled={!coordForm.name}>Save</button>
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

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header"><h2>Delete User</h2></div>
            <div className="modal-body">
              <p style={{ fontSize: 14 }}>
                Are you sure you want to delete <strong>{deleteConfirm.displayName || deleteConfirm.email}</strong>?
                This will remove their account and all role assignments. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={async () => {
                try {
                  await deleteUser(deleteConfirm.id)
                  setToast(`User ${deleteConfirm.displayName || deleteConfirm.email} deleted`)
                  setDeleteConfirm(null)
                } catch (err) {
                  setToast('Error: ' + err.message)
                }
              }}>Delete User</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

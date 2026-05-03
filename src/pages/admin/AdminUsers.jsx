import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useUsers } from '../../hooks/useFirestore'
import { updateUserRoles, updateUserCoordinator, deleteUser, approveEmployer, isSuperAdmin, getApplicationCount, getInternshipCount } from '../../services/firestore'
import Toast from '../../components/Toast'

const VALID_CATEGORIES = ['all', 'registered', 'incomplete', 'intern', 'employer', 'admin', 'awaiting_approval']

// Renders a Firestore Timestamp / ISO string / millis as e.g. "Apr 28, 2026"
function formatDate(value) {
  if (!value) return null
  let d
  if (typeof value === 'string') d = new Date(value)
  else if (value?.seconds) d = new Date(value.seconds * 1000)
  else if (value?.toDate) d = value.toDate()
  else if (typeof value === 'number') d = new Date(value)
  else return null
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const ALL_ROLES = ['intern', 'employer', 'admin']

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const { data: users, loading, error, retry } = useUsers()
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCategory = (() => {
    const c = searchParams.get('category')
    return c && VALID_CATEGORIES.includes(c) ? c : 'registered'
  })()
  const [categoryFilter, setCategoryFilter] = useState(initialCategory)
  const [locationFilter, setLocationFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState(() => new Set())
  const [confirmAction, setConfirmAction] = useState(null)
  const [coordinatorModal, setCoordinatorModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [profileModal, setProfileModal] = useState(null)
  const [profileStats, setProfileStats] = useState({ apps: null, postings: null })
  const [coordForm, setCoordForm] = useState({ name: '', email: '', phone: '' })
  const uidParam = searchParams.get('uid')
  const categoryParam = searchParams.get('category')

  // Deep link: keep the chip filter in sync with ?category=<chip>.
  useEffect(() => {
    if (categoryParam && VALID_CATEGORIES.includes(categoryParam) && categoryParam !== categoryFilter) {
      setCategoryFilter(categoryParam)
    }
  }, [categoryParam])

  // Deep link: open the profile modal when ?uid=<id> is in the URL.
  useEffect(() => {
    if (!uidParam || !users.length) return
    if (profileModal?.id === uidParam) return
    const found = users.find(u => u.id === uidParam)
    if (found) setProfileModal(found)
  }, [uidParam, users, profileModal?.id])

  const closeProfile = () => {
    setProfileModal(null)
    if (searchParams.has('uid')) {
      const next = new URLSearchParams(searchParams)
      next.delete('uid')
      setSearchParams(next, { replace: true })
    }
  }

  useEffect(() => {
    if (!profileModal) { setProfileStats({ apps: null, postings: null }); return }
    let cancelled = false
    const roles = profileModal.roles || []
    const tasks = []
    if (roles.includes('intern')) {
      tasks.push(getApplicationCount(profileModal.id).then(n => ({ apps: n })).catch(() => ({ apps: 'error' })))
    }
    if (roles.includes('employer')) {
      tasks.push(getInternshipCount(profileModal.id).then(n => ({ postings: n })).catch(() => ({ postings: 'error' })))
    }
    Promise.all(tasks).then(results => {
      if (cancelled) return
      setProfileStats(prev => results.reduce((acc, r) => ({ ...acc, ...r }), prev))
    })
    return () => { cancelled = true }
  }, [profileModal])

  // Unique locations from user school/chapter fields
  const userLocations = [...new Set(users.map(u => u.chapter || u.location || u.city).filter(Boolean))].sort()

  // Category counts (drives the dashboard chips at the top of the page).
  const counts = users.reduce((acc, u) => {
    const isSuper = isSuperAdmin(u.email)
    const roles = u.roles || []
    acc.all += 1
    if (u.onboarded === true) acc.registered += 1
    else acc.incomplete += 1
    if (roles.includes('intern')) acc.intern += 1
    if (roles.includes('employer')) {
      acc.employer += 1
      if (u.employerApproved !== true && !isSuper) acc.awaiting_approval += 1
    }
    if (roles.includes('admin') || isSuper) acc.admin += 1
    return acc
  }, { all: 0, registered: 0, incomplete: 0, intern: 0, employer: 0, admin: 0, awaiting_approval: 0 })

  // Sort: incomplete-signup users first, then by createdAt desc.
  const sorted = [...users].sort((a, b) => {
    const aIncomplete = a.onboarded !== true && !isSuperAdmin(a.email)
    const bIncomplete = b.onboarded !== true && !isSuperAdmin(b.email)
    if (aIncomplete !== bIncomplete) return aIncomplete ? -1 : 1
    const aTime = a.createdAt?.seconds || 0
    const bTime = b.createdAt?.seconds || 0
    return bTime - aTime
  })

  const matchCategory = (u) => {
    const isSuper = isSuperAdmin(u.email)
    const roles = u.roles || []
    switch (categoryFilter) {
      case 'all': return true
      case 'registered': return u.onboarded === true
      case 'incomplete': return u.onboarded !== true
      case 'intern': return roles.includes('intern')
      case 'employer': return roles.includes('employer')
      case 'admin': return roles.includes('admin') || isSuper
      case 'awaiting_approval':
        return roles.includes('employer') && u.employerApproved !== true && !isSuper
      default: return true
    }
  }

  const matchRoleSet = (u) => {
    if (roleFilter.size === 0) return true
    const isSuper = isSuperAdmin(u.email)
    const userRoles = isSuper ? ['admin', 'intern', 'employer'] : (u.roles || [])
    for (const r of roleFilter) if (userRoles.includes(r)) return true
    return false
  }

  const filtered = sorted.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || (u.email || '').toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.city || u.chapter || u.school || '').toLowerCase().includes(q)
    const matchLocation = locationFilter === 'all' ||
      (u.chapter || u.location || u.city || '') === locationFilter
    return matchSearch && matchCategory(u) && matchLocation && matchRoleSet(u)
  })

  const toggleRoleFilter = (role) => {
    setRoleFilter(prev => {
      const next = new Set(prev)
      next.has(role) ? next.delete(role) : next.add(role)
      return next
    })
  }

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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <CategoryChip label="All" count={counts.all}
          active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} />
        <CategoryChip label="Registered" count={counts.registered}
          active={categoryFilter === 'registered'} onClick={() => setCategoryFilter('registered')} />
        <CategoryChip label="Incomplete" count={counts.incomplete} tone="warning"
          active={categoryFilter === 'incomplete'} onClick={() => setCategoryFilter('incomplete')} />
        <CategoryChip label="Interns" count={counts.intern} tone="intern"
          active={categoryFilter === 'intern'} onClick={() => setCategoryFilter('intern')} />
        <CategoryChip label="Employers" count={counts.employer} tone="employer"
          active={categoryFilter === 'employer'} onClick={() => setCategoryFilter('employer')} />
        <CategoryChip label="Admins" count={counts.admin} tone="admin"
          active={categoryFilter === 'admin'} onClick={() => setCategoryFilter('admin')} />
        {counts.awaiting_approval > 0 && (
          <CategoryChip label="⚠ Awaiting employer approval" count={counts.awaiting_approval} tone="alert"
            active={categoryFilter === 'awaiting_approval'} onClick={() => setCategoryFilter('awaiting_approval')} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12, fontSize: 13 }}>
        <span style={{ color: 'var(--nriva-text-light)', fontWeight: 500 }}>Filter by role:</span>
        {ALL_ROLES.map(role => {
          const active = roleFilter.has(role)
          const palette = role === 'admin' ? '#b71c1c' : role === 'employer' ? '#1b5e20' : '#1a237e'
          return (
            <button key={role} type="button" onClick={() => toggleRoleFilter(role)}
              style={{
                padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', textTransform: 'capitalize',
                border: `1px solid ${active ? palette : 'var(--nriva-border)'}`,
                background: active ? palette : 'white',
                color: active ? 'white' : 'var(--nriva-text-light)',
                transition: 'all 0.15s',
              }}>
              {role}
            </button>
          )
        })}
        {roleFilter.size > 0 && (
          <button type="button" onClick={() => setRoleFilter(new Set())}
            style={{
              background: 'none', border: 0, padding: 0,
              color: 'var(--nriva-primary)', cursor: 'pointer',
              fontSize: 12, fontWeight: 500, textDecoration: 'underline',
            }}>
            Clear roles
          </button>
        )}
      </div>

      <div className="filter-bar">
        <input className="search-input" placeholder="Search by name, email, or location..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <tr key={user.id} style={{ cursor: 'pointer' }}
                      onClick={() => setProfileModal(user)}>
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
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setProfileModal(user) }}
                                className="user-name-link"
                                title="View profile"
                              >
                                {user.displayName || user.email?.split('@')[0] || user.email || '—'}
                              </button>
                              {!isSuper && user.onboarded !== true && (
                                <span style={{
                                  marginLeft: 8, fontSize: 10, background: '#fef3c7', color: '#92400e',
                                  padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                                  textTransform: 'uppercase', letterSpacing: 0.4,
                                }}
                                  title="This user signed in but never finished onboarding (matches the Incomplete chip filter).">
                                  Incomplete
                                </span>
                              )}
                              {isSuper && (
                                <span style={{
                                  marginLeft: 8, fontSize: 10, background: '#ff6f00', color: 'white',
                                  padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                                }}>SUPER ADMIN</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{user.email}</div>
                            {(() => {
                              const parts = []
                              if (user.gradeLevel) parts.push(`Grade ${user.gradeLevel}`)
                              if (user.school) parts.push(user.school)
                              if (user.city) parts.push(user.city)
                              if (typeof user.age === 'number') parts.push(`age ${user.age}${user.isMinor ? ' (minor)' : ''}`)
                              if (parts.length === 0) return null
                              return (
                                <div style={{ fontSize: 11, color: 'var(--nriva-text-light)', marginTop: 2 }}>
                                  {parts.join(' · ')}
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          {ALL_ROLES.map(role => {
                            const hasRole = isSuper || (user.roles || []).includes(role)
                            return (
                              <button key={role}
                                onClick={(e) => {
                                  e.stopPropagation()
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
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(user.roles || []).includes('employer') && !user.employerApproved && !isSuper && (
                            <button className="btn btn-sm btn-success" onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                await approveEmployer(user.id)
                                setToast(`Employer ${user.displayName || user.email} approved`)
                              } catch (err) { setToast('Error: ' + err.message) }
                            }} style={{ fontSize: 11, padding: '3px 10px' }}>
                              Approve
                            </button>
                          )}
                          <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openCoordinatorModal(user) }}
                            style={{ fontSize: 11, padding: '3px 10px' }}>
                            {user.coordinator ? 'Edit' : 'Assign'} Coordinator
                          </button>
                          {!isSuper && (
                            <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(user) }}
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

      {/* User Profile Modal */}
      {profileModal && (
        <div className="modal-overlay" onClick={closeProfile}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>User Profile</h2>
              <button onClick={closeProfile} aria-label="Close"
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                {profileModal.photoURL ? (
                  <img src={profileModal.photoURL} alt="" style={{ width: 56, height: 56, borderRadius: '50%' }} />
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: '#e8eaf6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'var(--nriva-primary)', fontSize: 22,
                  }}>
                    {(profileModal.displayName || profileModal.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 600 }}>
                    {profileModal.displayName || profileModal.email?.split('@')[0] || '—'}
                    {profileModal.isMinor && (
                      <span style={{ marginLeft: 8, fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                        MINOR
                      </span>
                    )}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--nriva-text-light)' }}>{profileModal.email}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(profileModal.roles || []).map(r => (
                      <span key={r} className={`badge badge-${r === 'admin' ? 'closed' : r === 'employer' ? 'open' : 'filled'}`}>
                        {r}
                      </span>
                    ))}
                    {profileModal.requestedRole && (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: '#e0f2fe', color: '#075985',
                        padding: '2px 10px', borderRadius: 999,
                        textTransform: 'uppercase', letterSpacing: 0.4,
                      }}
                      title="Role this user requested during onboarding">
                        Applied for: {profileModal.requestedRole}
                      </span>
                    )}
                    {isSuperAdmin(profileModal.email) && (
                      <span style={{ fontSize: 10, background: '#ff6f00', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>SUPER ADMIN</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--nriva-text-light)', flexWrap: 'wrap' }}>
                    {formatDate(profileModal.createdAt) && <span>Joined {formatDate(profileModal.createdAt)}</span>}
                    <span>{profileModal.onboarded ? 'Onboarded' : 'Onboarding incomplete'}</span>
                    <span style={{ fontFamily: 'monospace' }} title={profileModal.id}>ID {(profileModal.id || '').slice(0, 8)}…</span>
                  </div>
                </div>
              </div>

              {/* Approval checklist (only for users that need an admin decision) */}
              {(() => {
                const roles = profileModal.roles || []
                const needsRoleDecision = roles.length === 0 && !isSuperAdmin(profileModal.email)
                const needsEmployerApproval = roles.includes('employer') && profileModal.employerApproved !== true && !isSuperAdmin(profileModal.email)
                if (!needsRoleDecision && !needsEmployerApproval) return null

                const items = []
                items.push({ ok: !!profileModal.email, label: 'Email captured', detail: profileModal.email })
                items.push({ ok: profileModal.onboarded === true, label: 'Onboarding completed', detail: profileModal.onboarded ? 'yes' : 'no' })

                const requested = profileModal.requestedRole
                if (requested === 'intern' || roles.includes('intern')) {
                  const age = profileModal.age
                  items.push({ ok: typeof age === 'number', label: 'Date of birth on file', detail: age != null ? `age ${age}` : 'missing' })
                  if (profileModal.isMinor) {
                    items.push({ ok: !!profileModal.guardianName && !!profileModal.guardianEmail, label: 'Guardian on file (minor)', detail: profileModal.guardianName ? `${profileModal.guardianName} · ${profileModal.guardianEmail || '—'}` : 'missing' })
                    items.push({ ok: !!profileModal.parentNoticeAcknowledgedAt, label: 'Parental notice acknowledged', detail: profileModal.parentNoticeAcknowledgedAt ? formatDate(profileModal.parentNoticeAcknowledgedAt) || 'yes' : 'not acknowledged' })
                  }
                }
                if (requested === 'employer' || roles.includes('employer')) {
                  items.push({ ok: !!profileModal.companyName, label: 'Company name on file', detail: profileModal.companyName || 'missing' })
                  items.push({ ok: !!profileModal.companyWebsite, label: 'Company website on file', detail: profileModal.companyWebsite || 'missing' })
                }
                items.push({ ok: profileModal?.aiConsent?.granted === true, label: 'AI processing consent', detail: profileModal?.aiConsent?.granted ? (formatDate(profileModal.aiConsent.grantedAt) || 'granted') : 'not granted' })

                return (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      Approval checklist
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                      {items.map((it, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13 }}>
                          <span aria-hidden="true">{it.ok ? '✅' : '⚠️'}</span>
                          <span style={{ fontWeight: 500 }}>{it.label}:</span>
                          <span style={{ color: 'var(--nriva-text-light)' }}>{it.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })()}

              {/* Details grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
                padding: '16px 0', borderTop: '1px solid var(--nriva-border)',
              }}>
                {profileModal.nrivaMembership && (
                  <div><div style={profLabel}>NRIVA Membership</div><div style={profValue}>{profileModal.nrivaMembership}</div></div>
                )}
                {profileModal.gradeLevel && (
                  <div><div style={profLabel}>Grade Level</div><div style={profValue}>{profileModal.gradeLevel}</div></div>
                )}
                {profileModal.school && (
                  <div><div style={profLabel}>School</div><div style={profValue}>{profileModal.school}</div></div>
                )}
                {profileModal.city && (
                  <div><div style={profLabel}>Location</div><div style={profValue}>{profileModal.city}</div></div>
                )}
                {profileModal.availability && (
                  <div><div style={profLabel}>Availability</div><div style={profValue}>{profileModal.availability}</div></div>
                )}
                {profileModal.companyName && (
                  <div><div style={profLabel}>Company</div><div style={profValue}>{profileModal.companyName}</div></div>
                )}
                {profileModal.jobTitle && (
                  <div><div style={profLabel}>Job Title</div><div style={profValue}>{profileModal.jobTitle}</div></div>
                )}
                {profileModal.industry && (
                  <div><div style={profLabel}>Industry</div><div style={profValue}>{profileModal.industry}</div></div>
                )}
                {profileModal.companySize && (
                  <div><div style={profLabel}>Company Size</div><div style={profValue}>{profileModal.companySize}</div></div>
                )}
                {profileModal.companyWebsite && (
                  <div><div style={profLabel}>Website</div><div style={profValue}>
                    <a href={profileModal.companyWebsite} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--nriva-primary)' }}>{profileModal.companyWebsite}</a>
                  </div></div>
                )}
                {profileModal.employerApproved !== undefined && (profileModal.roles || []).includes('employer') && (
                  <div><div style={profLabel}>Employer Status</div><div style={profValue}>
                    {profileModal.employerApproved ? '✅ Approved' : '⏳ Pending approval'}
                  </div></div>
                )}
                {profileModal.dateOfBirth && (
                  <div><div style={profLabel}>Date of Birth</div><div style={profValue}>
                    {formatDate(profileModal.dateOfBirth) || profileModal.dateOfBirth}
                    {typeof profileModal.age === 'number' && (
                      <span style={{ color: 'var(--nriva-text-light)', fontWeight: 400 }}> · age {profileModal.age}</span>
                    )}
                  </div></div>
                )}
                {profileModal.isMinor && profileModal.guardianName && (
                  <div><div style={profLabel}>Guardian</div><div style={profValue}>
                    {profileModal.guardianName}
                    {profileModal.guardianEmail && (
                      <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', fontWeight: 400 }}>{profileModal.guardianEmail}</div>
                    )}
                  </div></div>
                )}
                {profileModal.isMinor && (
                  <div><div style={profLabel}>Parental Notice</div><div style={profValue}>
                    {profileModal.parentNoticeAcknowledgedAt
                      ? `✅ ${formatDate(profileModal.parentNoticeAcknowledgedAt) || 'acknowledged'}`
                      : <span style={{ color: 'var(--nriva-danger)' }}>⚠️ Not acknowledged</span>}
                  </div></div>
                )}
                {profileModal.aiConsent && (
                  <div><div style={profLabel}>AI Consent</div><div style={profValue}>
                    {profileModal.aiConsent.granted
                      ? `✅ ${formatDate(profileModal.aiConsent.grantedAt) || 'granted'}`
                      : 'Not granted'}
                  </div></div>
                )}
                {(profileModal.roles || []).includes('intern') && (
                  <div><div style={profLabel}>Applications</div><div style={profValue}>
                    {profileStats.apps === null ? '…' : profileStats.apps === 'error' ? '—' : profileStats.apps}
                  </div></div>
                )}
                {(profileModal.roles || []).includes('employer') && (
                  <div><div style={profLabel}>Postings</div><div style={profValue}>
                    {profileStats.postings === null ? '…' : profileStats.postings === 'error' ? '—' : profileStats.postings}
                  </div></div>
                )}
                {profileModal.placedInternshipId && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={profLabel}>Placed at</div>
                    <div style={profValue}>
                      <span style={{
                        display: 'inline-block',
                        background: '#dcfce7', color: '#166534',
                        padding: '4px 12px', borderRadius: 999,
                        fontSize: 13, fontWeight: 600,
                      }}>
                        🎉 {profileModal.placedCompany || 'Company'}
                        {profileModal.placedInternshipTitle ? ` · ${profileModal.placedInternshipTitle}` : ''}
                        {formatDate(profileModal.placedAt) ? ` · ${formatDate(profileModal.placedAt)}` : ''}
                      </span>
                    </div>
                  </div>
                )}
                {profileModal.termsAcknowledged?.acceptedAt && (
                  <div><div style={profLabel}>Terms Accepted</div><div style={profValue}>
                    {formatDate(profileModal.termsAcknowledged.acceptedAt) || 'yes'}
                    {profileModal.termsAcknowledged.version && (
                      <span style={{ color: 'var(--nriva-text-light)', fontSize: 12, fontWeight: 400 }}>
                        {' '}· v{profileModal.termsAcknowledged.version}
                      </span>
                    )}
                  </div></div>
                )}
                {profileModal.onboardedAt && (
                  <div><div style={profLabel}>Onboarded At</div><div style={profValue}>
                    {formatDate(profileModal.onboardedAt) || '—'}
                  </div></div>
                )}
                {profileModal.updatedAt && (
                  <div><div style={profLabel}>Last Updated</div><div style={profValue}>
                    {formatDate(profileModal.updatedAt) || '—'}
                  </div></div>
                )}
              </div>

              {(profileModal.internshipTypes || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={profLabel}>Internship Types Offered</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {profileModal.internshipTypes.map(t => (
                      <span key={t} style={{ background: '#fff7ed', color: '#9a3412', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills & Interests */}
              {(profileModal.skills || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={profLabel}>Skills</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {profileModal.skills.map(s => (
                      <span key={s} style={{ background: '#e8eaf6', color: 'var(--nriva-primary)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {(profileModal.interests || []).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={profLabel}>Internship Interests</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {profileModal.interests.map(i => (
                      <span key={i} style={{ background: '#f0fdf4', color: '#15803d', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{i}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {(profileModal.linkedIn || profileModal.portfolio || profileModal.resumeUrl) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  {profileModal.linkedIn && (
                    <a href={profileModal.linkedIn} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">LinkedIn ↗</a>
                  )}
                  {profileModal.portfolio && (
                    <a href={profileModal.portfolio} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">Portfolio ↗</a>
                  )}
                  {profileModal.resumeUrl && (
                    <a href={profileModal.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary"
                      title={profileModal.resumeName || 'Resume'}>
                      📎 {profileModal.resumeName ? 'Resume' : 'Resume'}
                    </a>
                  )}
                </div>
              )}

              {/* Experience / About */}
              {profileModal.experienceSummary && (
                <div style={{ marginTop: 16 }}>
                  <div style={profLabel}>Experience</div>
                  <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', lineHeight: 1.5, marginTop: 4 }}>{profileModal.experienceSummary}</p>
                </div>
              )}
              {profileModal.aboutMe && (
                <div style={{ marginTop: 12 }}>
                  <div style={profLabel}>About</div>
                  <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', lineHeight: 1.5, marginTop: 4 }}>{profileModal.aboutMe}</p>
                </div>
              )}

              {/* Coordinator */}
              {profileModal.coordinator && (
                <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                  <div style={profLabel}>Assigned Coordinator</div>
                  <div style={{ fontWeight: 500, fontSize: 14, marginTop: 4 }}>{profileModal.coordinator.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{profileModal.coordinator.email}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeProfile}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

const profLabel = { fontSize: 11, color: 'var(--nriva-text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }
const profValue = { fontSize: 14, fontWeight: 500, marginTop: 2 }

const CHIP_TONES = {
  default: { bg: 'white', border: '#e2e8f0', text: '#334155', activeBg: '#1a237e', activeText: 'white' },
  intern:   { bg: 'white', border: '#c7d2fe', text: '#1a237e', activeBg: '#1a237e', activeText: 'white' },
  employer: { bg: 'white', border: '#bbf7d0', text: '#166534', activeBg: '#1b5e20', activeText: 'white' },
  admin:    { bg: 'white', border: '#fecaca', text: '#991b1b', activeBg: '#b71c1c', activeText: 'white' },
  warning:  { bg: '#fffbeb', border: '#fde68a', text: '#92400e', activeBg: '#d97706', activeText: 'white' },
  alert:    { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', activeBg: '#dc2626', activeText: 'white' },
}

function CategoryChip({ label, count, tone = 'default', active, onClick }) {
  const palette = CHIP_TONES[tone] || CHIP_TONES.default
  return (
    <button type="button" onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', borderRadius: 999,
        border: `1px solid ${active ? palette.activeBg : palette.border}`,
        background: active ? palette.activeBg : palette.bg,
        color: active ? palette.activeText : palette.text,
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
        transition: 'all 0.15s',
      }}>
      <span>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: 700,
        background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
        color: active ? palette.activeText : palette.text,
        padding: '1px 8px', borderRadius: 999, minWidth: 22, textAlign: 'center',
      }}>{count}</span>
    </button>
  )
}

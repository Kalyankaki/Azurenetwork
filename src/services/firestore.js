import { db } from '../firebase'
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  addDoc, query, where, orderBy, onSnapshot, serverTimestamp, increment, limit, Timestamp,
  writeBatch,
} from 'firebase/firestore'

// Bootstrap super-admin allowlist. Configure via VITE_SUPER_ADMIN_EMAILS
// (comma-separated). Long-term: rely on the `roles` array on each user doc
// and shrink this list to a single break-glass account.
const SUPER_ADMIN_EMAILS = (
  import.meta.env.VITE_SUPER_ADMIN_EMAILS || 'kalyank.123@gmail.com'
).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

// Notifications are sent to the first email in the allowlist.
const SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAILS[0]

export const GRADE_LEVELS = [
  '10th Grade',
  '11th Grade',
  '12th Grade',
  'College Freshman',
  'College Sophomore',
  'College Junior',
  'College Senior',
]

// Internship statuses
export const INTERNSHIP_STATUSES = {
  PENDING_APPROVAL: 'pending_approval',
  OPEN: 'open',
  CLOSED: 'closed',
  FILLED: 'filled',
  REJECTED: 'rejected',
}

export const MAX_INTERN_APPLICATIONS = 4

// Retention windows (used to compute `expiresAt` for Firestore TTL deletion).
// Configure matching TTL policies in the Firebase console:
//   activity.expiresAt       → enable TTL
//   notifications.expiresAt  → enable TTL
const ACTIVITY_TTL_MS = 365 * 24 * 60 * 60 * 1000     // 12 months
const NOTIFICATION_TTL_MS = 180 * 24 * 60 * 60 * 1000 // 6 months

function expiresAtFromNow(ms) {
  return Timestamp.fromMillis(Date.now() + ms)
}

// Sensitive admin actions that should also send a real-time alert to admins.
const ALERTABLE_ACTIONS = new Set([
  'roles_changed',
  'user_deleted',
  'employer_approved',
  'internship_approved',
  'internship_rejected',
  'internship_deleted',
])

// ============ ACTIVITY LOG ============

export function logActivity(action, data = {}) {
  // Fire-and-forget with retry - don't block calling function
  const doLog = async (attempt = 1) => {
    try {
      await addDoc(collection(db, 'activity'), {
        action,
        ...data,
        createdAt: serverTimestamp(),
        expiresAt: expiresAtFromNow(ACTIVITY_TTL_MS),
      })

      // Real-time alert for high-sensitivity admin actions (R15).
      if (ALERTABLE_ACTIONS.has(action)) {
        sendAdminAlert(action, data).catch(() => { /* best-effort */ })
      }
    } catch (err) {
      if (attempt < 3) {
        setTimeout(() => doLog(attempt + 1), 1000 * attempt)
      } else {
        console.warn('Failed to log activity after 3 attempts:', action, err?.message)
      }
    }
  }
  // Small delay to ensure auth token is ready
  setTimeout(() => doLog(), 500)
}

export function subscribeActivity(onData, opts = {}, onError) {
  const q = query(
    collection(db, 'activity'),
    orderBy('createdAt', 'desc'),
    limit(opts.limit || 50)
  )
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error('subscribeActivity error:', err)
      if (onError) onError(err)
    }
  )
}

// ============ USERS ============

export async function createUser(uid, data) {
  const userRef = doc(db, 'users', uid)
  const existing = await getDoc(userRef)
  if (existing.exists()) return existing.data()
  const userData = {
    uid,
    email: data.email || '',
    displayName: data.displayName || '',
    photoURL: data.photoURL || '',
    roles: [],
    coordinator: null,
    onboarded: false,
    nrivaMembership: '',
    requestedRole: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(userRef, userData)
  logActivity('user_signup', { userUid: uid, email: data.email, displayName: data.displayName })
  return userData
}

export async function onboardUser(uid, data) {
  const { requestedRole, nrivaMembership, displayName, ...profileData } = data
  // Sanitize: never allow client to set roles, coordinator, or admin fields via onboarding
  delete profileData.roles
  delete profileData.coordinator
  delete profileData.uid
  const updates = {
    onboarded: true,
    requestedRole,
    nrivaMembership: nrivaMembership || '',
    ...profileData,
    updatedAt: serverTimestamp(),
  }
  if (displayName) updates.displayName = displayName
  // Auto-approve interns and employers (admin still requires manual admin approval)
  if (requestedRole === 'intern' || requestedRole === 'employer') {
    updates.roles = [requestedRole]
  }
  // Employers get role but need admin approval to view candidates
  if (requestedRole === 'employer') {
    updates.employerApproved = false
  }
  await updateDoc(doc(db, 'users', uid), updates)
  if (requestedRole === 'intern') {
    try {
      await setDoc(doc(db, 'public_stats', 'counts'), { students: increment(1) }, { merge: true })
    } catch { /* non-critical */ }
  }
  logActivity('user_onboarded', { userUid: uid, requestedRole, nrivaMembership })
  return (requestedRole === 'intern' || requestedRole === 'employer') ? [requestedRole] : []
}

export async function getApplicationCount(applicantUid) {
  const q = query(collection(db, 'applications'), where('applicantUid', '==', applicantUid))
  const snap = await getDocs(q)
  return snap.size
}

export async function getInternshipCount(employerUid) {
  const q = query(collection(db, 'internships'), where('employerUid', '==', employerUid))
  const snap = await getDocs(q)
  return snap.size
}

export async function getInternship(id) {
  const snap = await getDoc(doc(db, 'internships', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function sendAdminNotification(data) {
  // Store as a notification doc - can be picked up by a Cloud Function to send email
  await addDoc(collection(db, 'notifications'), {
    to: SUPER_ADMIN_EMAIL,
    type: data.type || 'new_signup',
    ...data,
    sent: false,
    createdAt: serverTimestamp(),
    expiresAt: expiresAtFromNow(NOTIFICATION_TTL_MS),
  })
}

// Real-time alert for sensitive admin actions (R15). Posts to /api/admin-alert
// which fans out to email via Resend. Falls back to a notifications doc on failure.
export async function sendAdminAlert(action, data = {}) {
  try {
    const res = await fetch('/api/admin-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data, occurredAt: new Date().toISOString() }),
    })
    if (res.ok) return
  } catch { /* fall through to firestore fallback */ }
  try {
    await addDoc(collection(db, 'notifications'), {
      to: SUPER_ADMIN_EMAIL,
      type: 'admin_alert',
      action,
      payload: data,
      sent: false,
      createdAt: serverTimestamp(),
      expiresAt: expiresAtFromNow(NOTIFICATION_TTL_MS),
    })
  } catch { /* swallow */ }
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateUserRoles(uid, roles, actorEmail = '') {
  await updateDoc(doc(db, 'users', uid), { roles, updatedAt: serverTimestamp() })
  logActivity('roles_changed', { userUid: uid, newRoles: roles, actorEmail })
}

export async function updateUserProfile(uid, data) {
  // Strip fields the user must not be able to set on themselves
  const { roles, coordinator, employerApproved, autoApproved, uid: _uid, email, createdAt, ...safe } = data
  await updateDoc(doc(db, 'users', uid), { ...safe, updatedAt: serverTimestamp() })
  logActivity('profile_updated', { userUid: uid })
}

export async function updateUserCoordinator(uid, coordinator) {
  await updateDoc(doc(db, 'users', uid), { coordinator, updatedAt: serverTimestamp() })
  logActivity('coordinator_assigned', { userUid: uid, coordinator })
}

export async function getAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function approveEmployer(uid) {
  await updateDoc(doc(db, 'users', uid), { employerApproved: true, updatedAt: serverTimestamp() })
  logActivity('employer_approved', { userUid: uid })
}

// Admin-only: update a user's contact fields (email / companyName /
// companyWebsite) on their Firestore doc. Does NOT touch Firebase Auth's
// login email — that requires the Admin SDK or a user-initiated re-auth.
//
// When backfillInternships is true and the email actually changed, every
// internship owned by this user gets its contactEmail (and `company` if
// the company name changed) rewritten so listings stay in sync.
export async function adminUpdateUserContact({
  uid, email, companyName, companyWebsite,
  backfillInternships = true, actorEmail = '',
}) {
  if (!uid) throw new Error('adminUpdateUserContact: uid required')

  // Read the current values so we can compute a diff + decide whether to backfill.
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  if (!snap.exists()) throw new Error('User not found')
  const current = snap.data() || {}

  const patch = { updatedAt: serverTimestamp() }
  const diff = {}
  if (email !== undefined && email !== current.email) { patch.email = email; diff.email = { from: current.email || '', to: email } }
  if (companyName !== undefined && companyName !== current.companyName) {
    patch.companyName = companyName
    diff.companyName = { from: current.companyName || '', to: companyName }
  }
  if (companyWebsite !== undefined && companyWebsite !== current.companyWebsite) {
    patch.companyWebsite = companyWebsite
    diff.companyWebsite = { from: current.companyWebsite || '', to: companyWebsite }
  }

  if (Object.keys(diff).length === 0) {
    return { updated: false, internshipsBackfilled: 0 }
  }

  await updateDoc(userRef, patch)

  let internshipsBackfilled = 0
  if (backfillInternships && (diff.email || diff.companyName)) {
    try {
      const intSnap = await getDocs(query(collection(db, 'internships'), where('employerUid', '==', uid)))
      const docs = intSnap.docs
      for (let i = 0; i < docs.length; i += 450) {
        const slice = docs.slice(i, i + 450)
        const batch = writeBatch(db)
        for (const d of slice) {
          const update = { updatedAt: serverTimestamp() }
          if (diff.email) update.contactEmail = email
          if (diff.companyName) update.company = companyName
          batch.update(d.ref, update)
        }
        await batch.commit()
        internshipsBackfilled += slice.length
      }
    } catch { /* best-effort */ }
  }

  logActivity('admin_user_contact_updated', { userUid: uid, diff, internshipsBackfilled, actorEmail })
  return { updated: true, internshipsBackfilled }
}

export async function deleteUser(uid) {
  await deleteDoc(doc(db, 'users', uid))
  logActivity('user_deleted', { userUid: uid })
}

// Returns a JSON-serialisable bundle of everything we hold about this user.
export async function exportUserData(uid) {
  const userSnap = await getDoc(doc(db, 'users', uid))
  const userDoc = userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null

  const appsSnap = await getDocs(query(
    collection(db, 'applications'),
    where('applicantUid', '==', uid)
  ))
  const applications = appsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  const messagesSnap = await getDocs(query(
    collection(db, 'messages'),
    where('senderUid', '==', uid)
  ))
  const messages = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  return {
    exportedAt: new Date().toISOString(),
    user: userDoc,
    applications,
    messages,
    note: 'Audit-log entries about you are retained for up to 12 months and not included here. Email an admin for those.',
  }
}

// Self-service account deletion for the signed-in user. Removes their user
// doc, all their applications, and resume(s). The Firebase Auth account is
// removed by the caller via deleteCurrentUserAuth() because that needs a
// recently-signed-in token.
export async function selfDeleteUser(uid) {
  // Applications
  try {
    const appsSnap = await getDocs(query(
      collection(db, 'applications'),
      where('applicantUid', '==', uid)
    ))
    await Promise.all(appsSnap.docs.map(d => deleteDoc(d.ref).catch(() => null)))
  } catch (e) { console.warn('app cleanup failed:', e?.message) }

  // Messages submitted by this user
  try {
    const msgsSnap = await getDocs(query(
      collection(db, 'messages'),
      where('senderUid', '==', uid)
    ))
    await Promise.all(msgsSnap.docs.map(d => deleteDoc(d.ref).catch(() => null)))
  } catch (e) { console.warn('messages cleanup failed:', e?.message) }

  // User doc last (so the rules still see the user as themselves while above runs)
  await deleteDoc(doc(db, 'users', uid))
  logActivity('user_self_deleted', { userUid: uid })
}

export function getUserRoles(email, firestoreRoles = []) {
  if (isSuperAdmin(email)) return ['intern', 'employer', 'admin']
  return firestoreRoles
}

export function isSuperAdmin(email) {
  return !!email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}

// ============ INTERNSHIPS ============

export async function createInternship(data) {
  // New internships go to pending_approval unless super admin is posting
  const ref = await addDoc(collection(db, 'internships'), {
    ...data,
    status: data.status || INTERNSHIP_STATUSES.PENDING_APPROVAL,
    applicants: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  logActivity('internship_created', {
    internshipId: ref.id,
    title: data.title,
    company: data.company,
    employerUid: data.employerUid,
  })
  return ref.id
}

export async function updateInternship(id, data) {
  await updateDoc(doc(db, 'internships', id), { ...data, updatedAt: serverTimestamp() })
  if (data.status) {
    logActivity('internship_status_changed', { internshipId: id, newStatus: data.status })
  }
}

export async function approveInternship(id, approverEmail = '') {
  await updateDoc(doc(db, 'internships', id), {
    status: INTERNSHIP_STATUSES.OPEN,
    approvedAt: serverTimestamp(),
    approvedBy: approverEmail,
    updatedAt: serverTimestamp(),
  })
  logActivity('internship_approved', { internshipId: id, approverEmail })
}

export async function rejectInternship(id, reason = '', rejecterEmail = '') {
  await updateDoc(doc(db, 'internships', id), {
    status: INTERNSHIP_STATUSES.REJECTED,
    rejectionReason: reason,
    rejectedBy: rejecterEmail,
    updatedAt: serverTimestamp(),
  })
  logActivity('internship_rejected', { internshipId: id, rejecterEmail, reason })
}

export async function deleteInternship(id) {
  await deleteDoc(doc(db, 'internships', id))
  logActivity('internship_deleted', { internshipId: id })
}

// Admin-only: shift an internship from one employer rep to another.
// Updates employerUid + the denormalised employer/company fields on the
// internship doc and logs the change. Existing applications under this
// internship keep their original employerUid snapshot (set at apply-time)
// — see issue #89 for follow-up if historical apps need to follow the rep.
export async function reassignInternshipEmployer({
  internshipId, newEmployerUid, newEmployerName, newCompany,
  newContactEmail, oldEmployerUid, actorEmail = '',
}) {
  if (!internshipId || !newEmployerUid) {
    throw new Error('reassignInternshipEmployer: internshipId + newEmployerUid required')
  }
  await updateDoc(doc(db, 'internships', internshipId), {
    employerUid: newEmployerUid,
    employerName: newEmployerName || '',
    company: newCompany || '',
    contactEmail: newContactEmail || '',
    updatedAt: serverTimestamp(),
  })
  logActivity('internship_employer_reassigned', {
    internshipId,
    oldEmployerUid: oldEmployerUid || null,
    newEmployerUid,
    newEmployerName: newEmployerName || '',
    newCompany: newCompany || '',
    actorEmail,
  })

  // Backfill historical applications so the new rep can read them under
  // the existing 'resource.data.employerUid == request.auth.uid' rule.
  // Chunk under the 500-write batch cap. Best-effort: a failure here
  // doesn't undo the internship reassign.
  try {
    const appsSnap = await getDocs(query(
      collection(db, 'applications'),
      where('internshipId', '==', internshipId),
    ))
    let updated = 0
    for (let i = 0; i < appsSnap.docs.length; i += 450) {
      const slice = appsSnap.docs.slice(i, i + 450)
      const batch = writeBatch(db)
      for (const d of slice) {
        batch.update(d.ref, {
          employerUid: newEmployerUid,
          employerName: newEmployerName || '',
          company: newCompany || '',
          updatedAt: serverTimestamp(),
        })
      }
      await batch.commit()
      updated += slice.length
    }
    if (updated > 0) {
      logActivity('applications_reassigned', {
        internshipId,
        newEmployerUid,
        applicationsUpdated: updated,
        actorEmail,
      })
    }
  } catch { /* swallow — the internship reassign already committed */ }
}

export function subscribeInternships(onData, filters = {}, onError) {
  let q = collection(db, 'internships')
  const constraints = []
  if (filters.employerUid) constraints.push(where('employerUid', '==', filters.employerUid))
  if (filters.status) constraints.push(where('status', '==', filters.status))
  if (constraints.length > 0) q = query(q, ...constraints)
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error('subscribeInternships error:', err)
      if (onError) onError(err)
    }
  )
}

// ============ APPLICATIONS ============

export async function createApplication(data) {
  const ref = await addDoc(collection(db, 'applications'), {
    ...data, status: 'pending', appliedDate: serverTimestamp(),
  })
  // Auto-increment applicant count on the internship
  if (data.internshipId) {
    try {
      await updateDoc(doc(db, 'internships', data.internshipId), {
        applicants: increment(1),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.warn('Failed to increment applicant count:', err?.message)
    }
  }
  logActivity('application_submitted', {
    applicationId: ref.id,
    internshipId: data.internshipId,
    internshipTitle: data.internshipTitle,
    applicantUid: data.applicantUid,
    applicantName: data.applicantName,
  })
  return ref.id
}

export async function updateApplicationStatus(id, status, actorEmail = '') {
  const patch = { status, updatedAt: serverTimestamp() }
  // Stamp the moment the offer was extended so dashboards can age it
  // independently of any subsequent updatedAt bumps.
  if (status === 'offered') patch.offeredAt = serverTimestamp()
  await updateDoc(doc(db, 'applications', id), patch)
  logActivity('application_status_changed', { applicationId: id, newStatus: status, actorEmail })
}

export async function deleteApplication(id, actorEmail = '') {
  await deleteDoc(doc(db, 'applications', id))
  logActivity('application_deleted', { applicationId: id, actorEmail })
}

// Rewrite every internship doc whose `company` field equals `sourceName` so it
// reads `targetName`. Optionally also rewrite each employer user's
// `companyName`. Used by the admin "merge company" affordance to reconcile
// variant spellings (e.g. "ACME Inc" vs "Acme, Inc.").
//
// Writes are chunked to stay under the 500-doc Firestore writeBatch cap.
// Returns counts so the caller can confirm what changed.
export async function mergeCompany({ sourceName, targetName, alsoUpdateUsers = true, actorEmail = '' }) {
  const src = (sourceName || '').trim()
  const tgt = (targetName || '').trim()
  if (!src || !tgt) throw new Error('Both source and target company names are required.')
  if (src === tgt) return { internshipsUpdated: 0, usersUpdated: 0 }

  // Internships
  const intSnap = await getDocs(query(collection(db, 'internships'), where('company', '==', src)))
  const intDocs = intSnap.docs

  // Users (optional)
  let userDocs = []
  if (alsoUpdateUsers) {
    const userSnap = await getDocs(query(collection(db, 'users'), where('companyName', '==', src)))
    userDocs = userSnap.docs
  }

  const allWrites = [
    ...intDocs.map(d => ({ ref: d.ref, payload: { company: tgt, updatedAt: serverTimestamp() } })),
    ...userDocs.map(d => ({ ref: d.ref, payload: { companyName: tgt, updatedAt: serverTimestamp() } })),
  ]

  // Chunk under the 500-write batch cap.
  for (let i = 0; i < allWrites.length; i += 450) {
    const slice = allWrites.slice(i, i + 450)
    const batch = writeBatch(db)
    for (const w of slice) batch.update(w.ref, w.payload)
    await batch.commit()
  }

  logActivity('companies_merged', {
    sourceName: src,
    targetName: tgt,
    internshipsUpdated: intDocs.length,
    usersUpdated: userDocs.length,
    actorEmail,
  })

  return { internshipsUpdated: intDocs.length, usersUpdated: userDocs.length }
}

// Atomic single-offer acceptance.
// 1) Batches: write users/{uid}.placedInternshipId... + applications/{id}.status = 'offer_accepted'.
//    Server-side rules require these to land together for a first-time acceptance.
// 2) Best-effort: auto-decline all other applications by this applicant whose status is 'offered'.
//    A failure here does not roll back the acceptance — the user is placed.
export async function acceptOffer({ applicationId, applicantUid, internshipId, internshipTitle = '', company = '' }) {
  if (!applicationId || !applicantUid || !internshipId) {
    throw new Error('acceptOffer: missing required ids')
  }
  const batch = writeBatch(db)
  batch.update(doc(db, 'users', applicantUid), {
    placedInternshipId: internshipId,
    placedInternshipTitle: internshipTitle || '',
    placedCompany: company || '',
    placedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(db, 'applications', applicationId), {
    status: 'offer_accepted',
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
  logActivity('offer_accepted', { applicationId, applicantUid, internshipId })

  // Auto-decline every other open application by this intern.
  // We close pending / under_review / shortlisted / offered apps so employers
  // don't keep evaluating an intern who is no longer available. Terminal
  // statuses (offer_accepted, prior offer_declined, rejected) are untouched.
  // Best-effort: failures here don't roll back the acceptance.
  const NON_TERMINAL = ['pending', 'under_review', 'shortlisted', 'offered']
  try {
    const others = await getDocs(query(
      collection(db, 'applications'),
      where('applicantUid', '==', applicantUid),
      where('status', 'in', NON_TERMINAL),
    ))
    for (const d of others.docs) {
      if (d.id === applicationId) continue
      const previousStatus = d.data().status
      try {
        await updateDoc(d.ref, {
          status: 'offer_declined',
          autoDeclined: true,
          autoDeclinedReason: 'Accepted another offer',
          autoDeclinedFromStatus: previousStatus,
          updatedAt: serverTimestamp(),
        })
        logActivity('offer_auto_declined', { applicationId: d.id, applicantUid, previousStatus })
      } catch { /* ignore individual failures */ }
    }
  } catch { /* swallow — acceptance already committed */ }
}

export function subscribeApplications(onData, filters = {}, onError) {
  let q = collection(db, 'applications')
  const constraints = []
  if (filters.applicantUid) constraints.push(where('applicantUid', '==', filters.applicantUid))
  if (filters.employerUid) constraints.push(where('employerUid', '==', filters.employerUid))
  if (filters.internshipId) constraints.push(where('internshipId', '==', filters.internshipId))
  if (constraints.length > 0) q = query(q, ...constraints)
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error('subscribeApplications error:', err)
      if (onError) onError(err)
    }
  )
}

// ============ MESSAGES (Support/Issues) ============

export async function createMessage(data) {
  const ref = await addDoc(collection(db, 'messages'), {
    ...data,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  logActivity('message_submitted', {
    messageId: ref.id,
    subject: data.subject,
    category: data.category,
    senderUid: data.senderUid,
  })
  return ref.id
}

export async function updateMessageStatus(id, status, adminNote = '') {
  const updates = { status, updatedAt: serverTimestamp() }
  if (adminNote) updates.adminNote = adminNote
  if (status === 'resolved') updates.resolvedAt = serverTimestamp()
  await updateDoc(doc(db, 'messages', id), updates)
  logActivity('message_status_changed', { messageId: id, newStatus: status })
}

export function subscribeMessages(onData, filters = {}, onError) {
  let q = collection(db, 'messages')
  const constraints = []
  if (filters.senderUid) constraints.push(where('senderUid', '==', filters.senderUid))
  if (filters.status) constraints.push(where('status', '==', filters.status))
  if (constraints.length > 0) q = query(q, ...constraints)
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error('subscribeMessages error:', err)
      if (onError) onError(err)
    }
  )
}

// ============ ADMIN USERS ============

export function subscribeUsers(onData, _filters, onError) {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error('subscribeUsers error:', err)
      if (onError) onError(err)
    }
  )
}

export { SUPER_ADMIN_EMAIL }

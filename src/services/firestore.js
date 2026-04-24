import { db } from '../firebase'
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  addDoc, query, where, orderBy, onSnapshot, serverTimestamp, increment, limit,
} from 'firebase/firestore'

const SUPER_ADMIN_EMAIL = 'kalyank.123@gmail.com'

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

// ============ ACTIVITY LOG ============

export function logActivity(action, data = {}) {
  // Fire-and-forget with retry - don't block calling function
  const doLog = async (attempt = 1) => {
    try {
      await addDoc(collection(db, 'activity'), {
        action,
        ...data,
        createdAt: serverTimestamp(),
      })
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

export async function sendAdminNotification(data) {
  // Store as a notification doc - can be picked up by a Cloud Function to send email
  await addDoc(collection(db, 'notifications'), {
    to: SUPER_ADMIN_EMAIL,
    type: data.type || 'new_signup',
    ...data,
    sent: false,
    createdAt: serverTimestamp(),
  })
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateUserRoles(uid, roles, actorEmail = '') {
  await updateDoc(doc(db, 'users', uid), { roles, updatedAt: serverTimestamp() })
  logActivity('roles_changed', { userUid: uid, newRoles: roles, actorEmail })
}

export async function updateUserCoordinator(uid, coordinator) {
  await updateDoc(doc(db, 'users', uid), { coordinator, updatedAt: serverTimestamp() })
  logActivity('coordinator_assigned', { userUid: uid, coordinator })
}

export async function getAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function deleteUser(uid) {
  await deleteDoc(doc(db, 'users', uid))
  logActivity('user_deleted', { userUid: uid })
}

export function getUserRoles(email, firestoreRoles = []) {
  if (email === SUPER_ADMIN_EMAIL) return ['intern', 'employer', 'admin']
  return firestoreRoles
}

export function isSuperAdmin(email) {
  return email === SUPER_ADMIN_EMAIL
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
  await updateDoc(doc(db, 'applications', id), { status, updatedAt: serverTimestamp() })
  logActivity('application_status_changed', { applicationId: id, newStatus: status, actorEmail })
}

export function subscribeApplications(onData, filters = {}, onError) {
  let q = collection(db, 'applications')
  const constraints = []
  if (filters.applicantUid) constraints.push(where('applicantUid', '==', filters.applicantUid))
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

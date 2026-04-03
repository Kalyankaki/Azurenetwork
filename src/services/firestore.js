import { db } from '../firebase'
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'

const SUPER_ADMIN_EMAIL = 'kalyank.123@gmail.com'

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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(userRef, userData)
  return userData
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateUserRoles(uid, roles) {
  await updateDoc(doc(db, 'users', uid), { roles, updatedAt: serverTimestamp() })
}

export async function getAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export function getUserRoles(email, firestoreRoles = []) {
  if (email === SUPER_ADMIN_EMAIL) return ['intern', 'employer', 'admin']
  return firestoreRoles
}

export function isSuperAdmin(email) {
  return email === SUPER_ADMIN_EMAIL
}

export async function createInternship(data) {
  const ref = await addDoc(collection(db, 'internships'), {
    ...data, status: data.status || 'open',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateInternship(id, data) {
  await updateDoc(doc(db, 'internships', id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteInternship(id) {
  await deleteDoc(doc(db, 'internships', id))
}

export function subscribeInternships(callback, filters = {}) {
  let q = collection(db, 'internships')
  const constraints = []
  if (filters.employerUid) constraints.push(where('employerUid', '==', filters.employerUid))
  if (filters.status) constraints.push(where('status', '==', filters.status))
  if (constraints.length > 0) q = query(q, ...constraints)
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function createApplication(data) {
  const ref = await addDoc(collection(db, 'applications'), {
    ...data, status: 'pending', appliedDate: serverTimestamp(),
  })
  return ref.id
}

export async function updateApplicationStatus(id, status) {
  await updateDoc(doc(db, 'applications', id), { status, updatedAt: serverTimestamp() })
}

export function subscribeApplications(callback, filters = {}) {
  let q = collection(db, 'applications')
  const constraints = []
  if (filters.applicantUid) constraints.push(where('applicantUid', '==', filters.applicantUid))
  if (filters.internshipId) constraints.push(where('internshipId', '==', filters.internshipId))
  if (constraints.length > 0) q = query(q, ...constraints)
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function subscribeUsers(callback) {
  return onSnapshot(collection(db, 'users'), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export { SUPER_ADMIN_EMAIL }

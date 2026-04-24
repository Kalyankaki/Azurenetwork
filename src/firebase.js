import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, clearIndexedDbPersistence } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "REPLACE_WITH_YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "REPLACE_WITH_YOUR_APP_ID",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const storage = getStorage(app)

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return { user: result.user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

export async function signInWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return { user: result.user, error: null }
  } catch (error) {
    return { user: null, error: friendlyAuthError(error.code) || error.message }
  }
}

export async function signUpWithEmail(email, password, displayName) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(result.user, { displayName })
    }
    return { user: result.user, error: null }
  } catch (error) {
    return { user: null, error: friendlyAuthError(error.code) || error.message }
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email)
    return { error: null }
  } catch (error) {
    return { error: friendlyAuthError(error.code) || error.message }
  }
}

function friendlyAuthError(code) {
  const map = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with that email already exists. Try signing in.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/unauthorized-domain': 'This domain is not authorized. Contact the administrator.',
  }
  return map[code]
}

export async function uploadResume(file, applicantUid) {
  if (!file) throw new Error('No file provided')
  if (file.size > 5 * 1024 * 1024) throw new Error('File size must be under 5MB')
  const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowed.includes(file.type)) {
    throw new Error('Only PDF, DOC, or DOCX files are allowed')
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `resumes/${applicantUid}/${Date.now()}_${safeName}`
  const fileRef = storageRef(storage, path)
  const snap = await uploadBytes(fileRef, file)
  const url = await getDownloadURL(snap.ref)
  return { url, path, name: file.name }
}

export async function logOut() {
  try {
    await signOut(auth)
    // Clear cached Firestore data on logout (privacy on shared devices)
    try { await clearIndexedDbPersistence(db) } catch { /* may fail if other tabs open */ }
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export { auth, db, storage }

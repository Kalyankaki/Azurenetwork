import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

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

// Initialize Firestore with persistent cache to prevent offline issues
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

export async function logOut() {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export { auth, db }

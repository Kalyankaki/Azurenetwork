import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthChange, signInWithGoogle, logOut } from '../firebase'
import { createUser, getUser, getUserRoles, isSuperAdmin } from '../services/firestore'

const AuthContext = createContext(null)

// Timeout for Firestore operations during auth - don't block sign-in indefinitely
const AUTH_FIRESTORE_TIMEOUT = 6000

function withTimeout(promise, ms, fallback = null) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
  ])
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [availableRoles, setAvailableRoles] = useState([])
  const [activeRole, setActiveRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userCoordinator, setUserCoordinator] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'unknown',
        }
        // Set user immediately - don't wait for Firestore
        setUser(userData)

        // Apply super admin roles immediately (synchronous check)
        const isSuper = isSuperAdmin(firebaseUser.email)
        if (isSuper) {
          setAvailableRoles(['intern', 'employer', 'admin'])
          const savedRole = localStorage.getItem(`nriva_role_${firebaseUser.uid}`)
          if (savedRole && ['intern', 'employer', 'admin'].includes(savedRole)) {
            setActiveRole(savedRole)
          }
        }

        // Stop showing "loading" immediately - user is authenticated
        setLoading(false)

        // Fetch Firestore user data in background (non-blocking)
        try {
          let firestoreUser = await withTimeout(getUser(firebaseUser.uid), AUTH_FIRESTORE_TIMEOUT)

          if (!firestoreUser) {
            // Try to create user doc (best-effort, also with timeout)
            try {
              await withTimeout(createUser(firebaseUser.uid, userData), AUTH_FIRESTORE_TIMEOUT)
            } catch (e) {
              console.warn('createUser failed (non-blocking):', e?.message)
            }
            firestoreUser = { roles: [] }
          }

          const roles = getUserRoles(firebaseUser.email, firestoreUser.roles || [])
          setAvailableRoles(roles)
          setUserCoordinator(firestoreUser.coordinator || null)

          // Restore last active role if available
          const savedRole = localStorage.getItem(`nriva_role_${firebaseUser.uid}`)
          if (savedRole && roles.includes(savedRole)) {
            setActiveRole(savedRole)
          } else if (roles.length === 1) {
            setActiveRole(roles[0])
          }
        } catch (err) {
          console.warn('Firestore profile load failed (non-blocking):', err?.message)
          // Super admin already set above; otherwise leave empty roles
        }
      } else {
        setUser(null)
        setAvailableRoles([])
        setActiveRole(null)
        setUserCoordinator(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    const result = await signInWithGoogle()
    // onAuthStateChanged handles the rest
    return result
  }

  const selectRole = useCallback((newRole) => {
    if (availableRoles.includes(newRole)) {
      setActiveRole(newRole)
      if (user?.uid) {
        localStorage.setItem(`nriva_role_${user.uid}`, newRole)
      }
    }
  }, [availableRoles, user])

  const refreshRoles = useCallback(async () => {
    if (!user?.uid) return
    try {
      const firestoreUser = await withTimeout(getUser(user.uid), AUTH_FIRESTORE_TIMEOUT)
      if (firestoreUser) {
        const roles = getUserRoles(user.email, firestoreUser.roles || [])
        setAvailableRoles(roles)
        setUserCoordinator(firestoreUser.coordinator || null)
      }
    } catch (err) {
      console.warn('Failed to refresh roles:', err?.message)
    }
  }, [user])

  const logout = async () => {
    await logOut()
    setUser(null)
    setAvailableRoles([])
    setActiveRole(null)
    setUserCoordinator(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      availableRoles,
      activeRole,
      loading,
      userCoordinator,
      loginWithGoogle,
      selectRole,
      refreshRoles,
      logout,
      isAuthenticated: !!user,
      role: activeRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

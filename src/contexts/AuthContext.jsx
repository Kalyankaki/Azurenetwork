import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthChange, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logOut } from '../firebase'
import { createUser, getUser, getUserRoles, isSuperAdmin, updateUserRoles } from '../services/firestore'

const AuthContext = createContext(null)

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
  const [onboarded, setOnboarded] = useState(false)

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
        setUser(userData)

        const isSuper = isSuperAdmin(firebaseUser.email)
        if (isSuper) {
          setAvailableRoles(['intern', 'employer', 'admin'])
          const savedRole = localStorage.getItem(`nriva_role_${firebaseUser.uid}`)
          if (savedRole && ['intern', 'employer', 'admin'].includes(savedRole)) {
            setActiveRole(savedRole)
          }
        }

        setLoading(false)

        try {
          let firestoreUser = await withTimeout(getUser(firebaseUser.uid), AUTH_FIRESTORE_TIMEOUT)
          if (!firestoreUser) {
            try {
              await withTimeout(createUser(firebaseUser.uid, userData), AUTH_FIRESTORE_TIMEOUT)
            } catch (e) {
              console.warn('createUser failed:', e?.message)
            }
            firestoreUser = { roles: [] }
          }
          // One-time auto-approve migration: existing onboarded users with
          // requestedRole=employer but no 'employer' role (from before approval
          // was removed) get it granted on next sign-in.
          if (
            firestoreUser.onboarded &&
            firestoreUser.requestedRole === 'employer' &&
            !(firestoreUser.roles || []).includes('employer') &&
            !isSuper
          ) {
            try {
              const nextRoles = Array.from(new Set([...(firestoreUser.roles || []), 'employer']))
              await updateUserRoles(firebaseUser.uid, nextRoles, 'auto-migration')
              firestoreUser = { ...firestoreUser, roles: nextRoles }
            } catch (e) {
              console.warn('auto-approve employer migration failed:', e?.message)
            }
          }
          const roles = getUserRoles(firebaseUser.email, firestoreUser.roles || [])
          setAvailableRoles(roles)
          setUserCoordinator(firestoreUser.coordinator || null)
          setOnboarded(firestoreUser.onboarded || false)

          const savedRole = localStorage.getItem(`nriva_role_${firebaseUser.uid}`)
          if (savedRole && roles.includes(savedRole)) {
            setActiveRole(savedRole)
          } else if (roles.length === 1) {
            setActiveRole(roles[0])
          }
        } catch (err) {
          console.warn('Firestore profile load failed:', err?.message)
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

  const loginWithGoogle = async () => signInWithGoogle()
  const loginWithEmail = async (email, password) => signInWithEmail(email, password)
  const signUp = async (email, password, displayName) => signUpWithEmail(email, password, displayName)
  const requestPasswordReset = async (email) => resetPassword(email)

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
    setOnboarded(false)
  }

  return (
    <AuthContext.Provider value={{
      user,
      availableRoles,
      activeRole,
      loading,
      userCoordinator,
      onboarded,
      loginWithGoogle,
      loginWithEmail,
      signUp,
      requestPasswordReset,
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

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthChange, signInWithGoogle, logOut } from '../firebase'
import { createUser, getUser, getUserRoles, isSuperAdmin } from '../services/firestore'

const AuthContext = createContext(null)

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
        setUser(userData)

        try {
          let firestoreUser = await getUser(firebaseUser.uid)
          if (!firestoreUser) {
            await createUser(firebaseUser.uid, userData)
            firestoreUser = { roles: [] }
          }
          const roles = getUserRoles(firebaseUser.email, firestoreUser.roles || [])
          setAvailableRoles(roles)
          setUserCoordinator(firestoreUser.coordinator || null)

          const savedRole = localStorage.getItem(`nriva_role_${firebaseUser.uid}`)
          if (savedRole && roles.includes(savedRole)) {
            setActiveRole(savedRole)
          } else if (roles.length === 1) {
            setActiveRole(roles[0])
          }
        } catch (err) {
          if (isSuperAdmin(firebaseUser.email)) {
            setAvailableRoles(['intern', 'employer', 'admin'])
          } else {
            setAvailableRoles([])
          }
          console.warn('Firestore not configured:', err.message)
        }
      } else {
        setUser(null)
        setAvailableRoles([])
        setActiveRole(null)
        setUserCoordinator(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    setLoading(true)
    const result = await signInWithGoogle()
    if (result.error) setLoading(false)
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
      const firestoreUser = await getUser(user.uid)
      if (firestoreUser) {
        const roles = getUserRoles(user.email, firestoreUser.roles || [])
        setAvailableRoles(roles)
        setUserCoordinator(firestoreUser.coordinator || null)
      }
    } catch (err) {
      console.warn('Failed to refresh roles:', err.message)
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

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthChange, signInWithGoogle, logOut } from '../firebase'
import { createUser, getUser, getUserRoles, isSuperAdmin } from '../services/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [availableRoles, setAvailableRoles] = useState([])
  const [activeRole, setActiveRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    // Check for demo mode in localStorage
    const savedDemo = localStorage.getItem('nriva_demo_mode')
    const savedRole = localStorage.getItem('nriva_role')
    const savedUser = localStorage.getItem('nriva_demo_user')

    if (savedDemo === 'true' && savedRole && savedUser) {
      setDemoMode(true)
      setActiveRole(savedRole)
      setAvailableRoles(['intern', 'employer', 'admin'])
      setUser(JSON.parse(savedUser))
      setLoading(false)
      return
    }

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

        // Fetch or create user in Firestore
        try {
          let firestoreUser = await getUser(firebaseUser.uid)
          if (!firestoreUser) {
            await createUser(firebaseUser.uid, userData)
            firestoreUser = { roles: [] }
          }
          const roles = getUserRoles(firebaseUser.email, firestoreUser.roles || [])
          setAvailableRoles(roles)

          // Restore last active role
          const savedRole = localStorage.getItem(`nriva_role_${firebaseUser.uid}`)
          if (savedRole && roles.includes(savedRole)) {
            setActiveRole(savedRole)
          } else if (roles.length === 1) {
            setActiveRole(roles[0])
          }
        } catch (err) {
          // If Firestore not configured, check for super admin at least
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

  const loginAsDemo = (demoRole) => {
    const demoUser = {
      uid: 'demo-user',
      email: 'demo@nriva.org',
      displayName: 'Demo User',
      photoURL: null,
      provider: 'demo',
    }
    setUser(demoUser)
    setAvailableRoles(['intern', 'employer', 'admin'])
    setActiveRole(demoRole)
    setDemoMode(true)
    localStorage.setItem('nriva_demo_mode', 'true')
    localStorage.setItem('nriva_role', demoRole)
    localStorage.setItem('nriva_demo_user', JSON.stringify(demoUser))
  }

  const selectRole = useCallback((newRole) => {
    if (availableRoles.includes(newRole) || demoMode) {
      setActiveRole(newRole)
      if (user?.uid && !demoMode) {
        localStorage.setItem(`nriva_role_${user.uid}`, newRole)
      }
      if (demoMode) {
        localStorage.setItem('nriva_role', newRole)
      }
    }
  }, [availableRoles, demoMode, user])

  const refreshRoles = useCallback(async () => {
    if (!user?.uid || demoMode) return
    try {
      const firestoreUser = await getUser(user.uid)
      if (firestoreUser) {
        const roles = getUserRoles(user.email, firestoreUser.roles || [])
        setAvailableRoles(roles)
      }
    } catch (err) {
      console.warn('Failed to refresh roles:', err.message)
    }
  }, [user, demoMode])

  const logout = async () => {
    if (demoMode) {
      localStorage.removeItem('nriva_demo_mode')
      localStorage.removeItem('nriva_role')
      localStorage.removeItem('nriva_demo_user')
      setDemoMode(false)
    } else {
      await logOut()
    }
    setUser(null)
    setAvailableRoles([])
    setActiveRole(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      availableRoles,
      activeRole,
      loading,
      demoMode,
      loginWithGoogle,
      loginAsDemo,
      selectRole,
      refreshRoles,
      logout,
      isAuthenticated: !!user,
      // Backward compat: expose 'role' as alias for activeRole
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

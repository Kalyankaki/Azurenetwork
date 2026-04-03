import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthChange, signInWithGoogle, logOut } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    // Check for demo mode in localStorage
    const savedDemo = localStorage.getItem('nriva_demo_mode')
    const savedRole = localStorage.getItem('nriva_role')
    const savedUser = localStorage.getItem('nriva_demo_user')

    if (savedDemo === 'true' && savedRole && savedUser) {
      setDemoMode(true)
      setRole(savedRole)
      setUser(JSON.parse(savedUser))
      setLoading(false)
      return
    }

    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'unknown',
        })
        // Load saved role
        const savedRole = localStorage.getItem(`nriva_role_${firebaseUser.uid}`)
        if (savedRole) setRole(savedRole)
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    setLoading(true)
    const result = await signInWithGoogle()
    setLoading(false)
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
    setRole(demoRole)
    setDemoMode(true)
    localStorage.setItem('nriva_demo_mode', 'true')
    localStorage.setItem('nriva_role', demoRole)
    localStorage.setItem('nriva_demo_user', JSON.stringify(demoUser))
  }

  const selectRole = (newRole) => {
    setRole(newRole)
    if (user?.uid && !demoMode) {
      localStorage.setItem(`nriva_role_${user.uid}`, newRole)
    }
    if (demoMode) {
      localStorage.setItem('nriva_role', newRole)
    }
  }

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
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      role,
      loading,
      demoMode,
      loginWithGoogle,
      loginAsDemo,
      selectRole,
      logout,
      isAuthenticated: !!user,
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

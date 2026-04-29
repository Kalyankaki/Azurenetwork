import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUser, updateUserProfile } from '../services/firestore'

// Tracks AI processing consent on the user doc.
// `aiConsent.granted` is true once the user accepts the disclosure for the first time.
// `aiConsent.grantedAt` is an ISO timestamp.
export function useAIConsent() {
  const { user } = useAuth()
  const [granted, setGranted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingResolver, setPendingResolver] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!user?.uid) {
      setLoading(false)
      return
    }
    getUser(user.uid)
      .then(p => {
        if (cancelled) return
        setGranted(!!p?.aiConsent?.granted)
      })
      .catch(() => { /* fail open: ask again */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.uid])

  // Returns a Promise<boolean>. If consent already granted, resolves true immediately.
  // Otherwise sets a flag so a modal can render and call accept()/decline().
  const ensureConsent = useCallback(() => {
    if (granted) return Promise.resolve(true)
    return new Promise(resolve => {
      setPendingResolver(() => resolve)
    })
  }, [granted])

  const accept = useCallback(async () => {
    if (user?.uid) {
      try {
        await updateUserProfile(user.uid, {
          aiConsent: { granted: true, grantedAt: new Date().toISOString() },
        })
      } catch { /* persisted best-effort; in-memory state still flips */ }
    }
    setGranted(true)
    if (pendingResolver) { pendingResolver(true); setPendingResolver(null) }
  }, [user?.uid, pendingResolver])

  const decline = useCallback(() => {
    if (pendingResolver) { pendingResolver(false); setPendingResolver(null) }
  }, [pendingResolver])

  return {
    granted,
    loading,
    promptOpen: pendingResolver !== null,
    ensureConsent,
    accept,
    decline,
  }
}

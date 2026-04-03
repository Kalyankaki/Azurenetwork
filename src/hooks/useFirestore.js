import { useState, useEffect } from 'react'
import {
  subscribeInternships,
  subscribeApplications,
  subscribeUsers,
  subscribeMessages,
} from '../services/firestore'

const TIMEOUT_MS = 10000

function useFirestoreSubscription(subscribeFn, filters, deps) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    let unsubscribe = null
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      setLoading(false)
      setError('Connection timed out. Please check your internet connection.')
    }, TIMEOUT_MS)

    try {
      unsubscribe = subscribeFn((items) => {
        if (!timedOut) {
          clearTimeout(timer)
          setData(items)
          setLoading(false)
          setError(null)
        }
      }, filters)
    } catch (err) {
      clearTimeout(timer)
      setError(err.message)
      setLoading(false)
    }

    return () => {
      clearTimeout(timer)
      if (unsubscribe) unsubscribe()
    }
  }, [...deps, retryCount])

  const retry = () => setRetryCount(c => c + 1)

  return { data, loading, error, retry }
}

export function useInternships(filters = {}) {
  return useFirestoreSubscription(
    subscribeInternships,
    filters,
    [filters.employerUid, filters.status]
  )
}

export function useApplications(filters = {}) {
  return useFirestoreSubscription(
    subscribeApplications,
    filters,
    [filters.applicantUid, filters.internshipId]
  )
}

export function useUsers() {
  return useFirestoreSubscription(subscribeUsers, {}, [])
}

export function useMessages(filters = {}) {
  return useFirestoreSubscription(
    subscribeMessages,
    filters,
    [filters.senderUid, filters.status]
  )
}

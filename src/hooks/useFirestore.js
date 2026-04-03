import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeInternships,
  subscribeApplications,
  subscribeUsers,
} from '../services/firestore'
import { sampleInternships, sampleApplications } from '../data'

export function useInternships(filters = {}) {
  const { demoMode } = useAuth()
  const [data, setData] = useState(demoMode ? sampleInternships : [])
  const [loading, setLoading] = useState(!demoMode)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (demoMode) {
      let filtered = [...sampleInternships]
      if (filters.employerUid) {
        // In demo, filter by employer name instead of UID
        filtered = filtered.filter(i =>
          i.employer === 'Rajesh Kumar' || i.employer === 'Priya Reddy'
        )
      }
      if (filters.status) {
        filtered = filtered.filter(i => i.status === filters.status)
      }
      setData(filtered)
      setLoading(false)
      return
    }

    try {
      const unsubscribe = subscribeInternships((internships) => {
        setData(internships)
        setLoading(false)
      }, filters)
      return () => unsubscribe()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [demoMode, filters.employerUid, filters.status])

  return { data, loading, error }
}

export function useApplications(filters = {}) {
  const { demoMode } = useAuth()
  const [data, setData] = useState(demoMode ? sampleApplications : [])
  const [loading, setLoading] = useState(!demoMode)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (demoMode) {
      let filtered = [...sampleApplications]
      if (filters.applicantUid) {
        // In demo, return all applications as if they belong to the user
        // (demo user sees all sample data)
      }
      if (filters.internshipId) {
        filtered = filtered.filter(a => String(a.internshipId) === String(filters.internshipId))
      }
      setData(filtered)
      setLoading(false)
      return
    }

    try {
      const unsubscribe = subscribeApplications((applications) => {
        setData(applications)
        setLoading(false)
      }, filters)
      return () => unsubscribe()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [demoMode, filters.applicantUid, filters.internshipId])

  return { data, loading, error }
}

export function useUsers() {
  const { demoMode } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(!demoMode)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (demoMode) {
      setData([
        { id: 'demo-1', email: 'demo@nriva.org', displayName: 'Demo User', roles: ['intern', 'employer', 'admin'], createdAt: new Date() },
      ])
      setLoading(false)
      return
    }

    try {
      const unsubscribe = subscribeUsers((users) => {
        setData(users)
        setLoading(false)
      })
      return () => unsubscribe()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [demoMode])

  return { data, loading, error }
}

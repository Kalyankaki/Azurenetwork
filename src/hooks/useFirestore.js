import { useState, useEffect } from 'react'
import {
  subscribeInternships,
  subscribeApplications,
  subscribeUsers,
  subscribeMessages,
} from '../services/firestore'

export function useInternships(filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
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
  }, [filters.employerUid, filters.status])

  return { data, loading, error }
}

export function useApplications(filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
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
  }, [filters.applicantUid, filters.internshipId])

  return { data, loading, error }
}

export function useUsers() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
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
  }, [])

  return { data, loading, error }
}

export function useMessages(filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      const unsubscribe = subscribeMessages((messages) => {
        setData(messages)
        setLoading(false)
      }, filters)
      return () => unsubscribe()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [filters.senderUid, filters.status])

  return { data, loading, error }
}

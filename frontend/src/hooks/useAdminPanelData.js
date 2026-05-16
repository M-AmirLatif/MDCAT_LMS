import { useEffect, useMemo, useState } from 'react'
import API from '../services/api'

const DEFAULT_OVERVIEW = {
  totalStudents: 0,
  activeStudents: 0,
  totalTeachers: 0,
  activeTeachers: 0,
  totalCourses: 0,
  totalMcqs: 0,
  totalAttempts: 0,
  totalChapters: 0,
  activeSubscriptions: 0,
  expiringSoon: 0,
  restrictedStudents: 0,
  pendingPayments: 0,
  completedPayments: 0,
  monthlyRevenue: 0,
}

export default function useAdminPanelData({ includeStudents = false, search = '' } = {}) {
  const [overview, setOverview] = useState(DEFAULT_OVERVIEW)
  const [recentStudents, setRecentStudents] = useState([])
  const [students, setStudents] = useState([])
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(includeStudents)
  const [error, setError] = useState('')

  const fetchOverview = async () => {
    try {
      const res = await API.get('/admin/overview')
      setOverview(res.data?.metrics || DEFAULT_OVERVIEW)
      setRecentStudents(res.data?.recentStudents || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load admin overview')
    } finally {
      setLoadingOverview(false)
    }
  }

  const fetchStudents = async () => {
    if (!includeStudents) return

    setLoadingStudents(true)
    try {
      const res = await API.get('/admin/users', {
        params: {
          role: 'student',
          limit: 200,
          search: search || undefined,
        },
      })
      setStudents(res.data?.users || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [includeStudents, search])

  const updateUser = async (userId, payload) => {
    const res = await API.put(`/admin/users/${userId}`, payload)
    const updatedUser = res.data?.user

    if (updatedUser) {
      setStudents((current) =>
        current.map((student) => (student._id === userId ? updatedUser : student)),
      )
      setRecentStudents((current) =>
        current.map((student) => (student._id === userId ? updatedUser : student)),
      )
    }

    await fetchOverview()
    return updatedUser
  }

  return useMemo(() => ({
    overview,
    recentStudents,
    students,
    loadingOverview,
    loadingStudents,
    error,
    refreshOverview: fetchOverview,
    refreshStudents: fetchStudents,
    updateUser,
  }), [overview, recentStudents, students, loadingOverview, loadingStudents, error])
}

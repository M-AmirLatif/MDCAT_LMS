import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'
import RoleTabs from '../components/RoleTabs'
import { getAuthToken, getAuthUser } from '../services/authStorage'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const currentUser = getAuthUser()
  const isSuperAdmin = currentUser?.role === 'superadmin'
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'teacher',
  })

  const fetchData = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        navigate('/login')
        return
      }

      const [usersRes, coursesRes] = await Promise.all([
        API.get('/admin/users'),
        API.get('/admin/courses'),
      ])

      setUsers(usersRes.data.users || [])
      setCourses(coursesRes.data.courses || [])
    } catch (err) {
      setError('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const updateUser = async (userId, payload) => {
    try {
      await API.put(`/admin/users/${userId}`, payload)
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user')
    }
  }

  const handleCreateChange = (e) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value })
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await API.post('/admin/users', createForm)
      setSuccess('Staff account created successfully.')
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: isSuperAdmin ? 'teacher' : 'teacher',
      })
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user')
    }
  }

  const toggleUserStatus = (user) => {
    updateUser(user._id, { isActive: !user.isActive })
  }

  const changeRole = (userId, role) => {
    updateUser(userId, { role })
  }

  const toggleCoursePublish = async (course) => {
    try {
      await API.put(`/courses/${course._id}`, {
        isPublished: !course.isPublished,
      })
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update course')
    }
  }

  if (loading)
    return (
      <div className="admin-dashboard">
        <p>Loading admin dashboard...</p>
      </div>
    )

  return (
    <div className="admin-dashboard">
      <div className="navbar">
        <h1>MDCAT LMS</h1>
        <button onClick={() => navigate('/dashboard')}>Back</button>
      </div>
      <RoleTabs user={currentUser} />

      <div className="admin-container">
        <h2>Admin Panel</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className="section">
          <h3>Create Staff Account</h3>
          <p className="helper-text">
            Students sign up themselves with Gmail OTP. Staff accounts use
            internal emails and are auto-verified.
          </p>
          <form className="create-user-form" onSubmit={handleCreateUser}>
            <input
              type="text"
              name="firstName"
              placeholder="First name"
              value={createForm.firstName}
              onChange={handleCreateChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last name"
              value={createForm.lastName}
              onChange={handleCreateChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="teacher1@mdcat.local"
              value={createForm.email}
              onChange={handleCreateChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Temporary password"
              value={createForm.password}
              onChange={handleCreateChange}
              required
            />
            <select
              name="role"
              value={createForm.role}
              onChange={handleCreateChange}
            >
              <option value="teacher">teacher</option>
              {isSuperAdmin && <option value="admin">admin</option>}
              {isSuperAdmin && <option value="superadmin">superadmin</option>}
            </select>
            <button type="submit">Create User</button>
          </form>
        </div>

        <div className="section">
          <h3>Users</h3>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isProtected =
                    !isSuperAdmin &&
                    (user.role === 'admin' || user.role === 'superadmin')
                  return (
                    <tr key={user._id}>
                      <td>
                        {user.firstName} {user.lastName}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {isProtected ? (
                          <span className="role-pill">{user.role}</span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => changeRole(user._id, e.target.value)}
                          >
                            <option value="student">student</option>
                            <option value="teacher">teacher</option>
                            {isSuperAdmin && <option value="admin">admin</option>}
                            {isSuperAdmin && (
                              <option value="superadmin">superadmin</option>
                            )}
                          </select>
                        )}
                      </td>
                      <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button
                          onClick={() => toggleUserStatus(user)}
                          disabled={isProtected}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section">
          <h3>Courses</h3>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Instructor</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id}>
                    <td>{course.name}</td>
                    <td>{course.category}</td>
                    <td>
                      {course.createdBy?.firstName} {course.createdBy?.lastName}
                    </td>
                    <td>{course.enrolledCount || 0}</td>
                    <td>{course.isPublished ? 'Published' : 'Draft'}</td>
                    <td>
                      <button onClick={() => toggleCoursePublish(course)}>
                        {course.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}



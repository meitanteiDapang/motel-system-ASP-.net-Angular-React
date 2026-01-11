import { useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../../context/globalContext'
import './AdminShared.css'
import './AdminPage.css'
import { useEffect, useState } from 'react'
import BookingsTable from './table/bookingsTable'
import BookingsTimeline from './timeline/bookingsTimeline'

export type AdminBooking = {
  id?: number
  roomTypeId?: number
  roomNumber?: number
  checkInDate?: string
  checkOutDate?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
}

const AdminPage = () => {
  const navigate = useNavigate()
  const { state, globalDispatch } = useGlobalContext()
  const token = state.adminToken
  const [activeTab, setActiveTab] = useState<'table' | 'timeline'>('table')

  const logout = () => {
    globalDispatch({
      type: 'clearAdminToken',
    })
    navigate('/')
  }

  const tableTabClass = `admin-tab-btn ${activeTab === 'table' ? 'is-active' : ''}`
  const timelineTabClass = `admin-tab-btn ${activeTab === 'timeline' ? 'is-active' : ''}`
  const tabPanel = activeTab === 'table' ? <BookingsTable /> : <BookingsTimeline />

  // Redirect to login if token is missing; backend still enforces auth.
  useEffect(() => {
    // Guard the route client-side; the API still enforces auth server-side.
    if (!token) {
      navigate('/adminLogin')
    }
  }, [token, navigate])

  const adminContent = token ? (
    <>
      <div className="admin-tabs">
        <button
          type="button"
          className={tableTabClass}
          onClick={() => setActiveTab('table')}
        >
          Bookings Table
        </button>
        <button
          type="button"
          className={timelineTabClass}
          onClick={() => setActiveTab('timeline')}
        >
          Bookings Timeline
        </button>
      </div>
      <div className="admin-tab-panel">{tabPanel}</div>
    </>
  ) : null

  return (
    <div className="page bright admin-page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="auth-shell">
        <div className="auth-card">
          <div className="admin-header">
            <h1>Admin Dashboard</h1>
            <div className="admin-header-actions">
              <button
                className="book-btn admin-flat-btn"
                type="button"
                onClick={() => {
                  navigate('/')
                }}
              >
                Back to home
              </button>
              <button
                className="book-btn admin-flat-btn"
                type="button"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>
          {adminContent}
        </div>
      </div>
    </div>
  )
}

export default AdminPage

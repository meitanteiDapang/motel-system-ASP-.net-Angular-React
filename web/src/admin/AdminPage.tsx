import { useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../context/globalContext'
import './AdminShared.css'
import './AdminPage.css'
import { useEffect, useState } from 'react'
import BookingsTable from './bookingsTable'
import BookingsTimeline from './bookingsTimeline'

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
  const globalContext = useGlobalContext()
  const token = globalContext.state.adminToken
  const [activeTab, setActiveTab] = useState<'table' | 'timeline'>('table')


  const logout = ()=>{
    globalContext.globalDispatch({
      type: 'clearAdminToken'
    })
    navigate('/')
  }


  useEffect(()=>{
    if (!token) {
      navigate("/adminLogin")
    }
  }, [token, navigate])

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
              <button className="book-btn admin-flat-btn"
               type="button"
               onClick={logout}>
                Logout
              </button>
            </div>
          </div>
          {token ? (
            <>
              <div className="admin-tabs">
                <button
                  type="button"
                  className={`admin-tab-btn ${activeTab === 'table' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('table')}
                >
                  Bookings Table
                </button>
                <button
                  type="button"
                  className={`admin-tab-btn ${activeTab === 'timeline' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('timeline')}
                >
                  Bookings Timeline
                </button>
              </div>
              <div className="admin-tab-panel">
                {activeTab === 'table' && <BookingsTable />}
                {activeTab === 'timeline' && <BookingsTimeline />}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AdminPage

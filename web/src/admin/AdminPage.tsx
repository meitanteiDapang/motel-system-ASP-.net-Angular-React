import { useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../context/globalContext'
import './AdminShared.css'
import './AdminPage.css'
import { useEffect, useState } from 'react'
import { apiUrl } from '../apiClient'

type AdminBooking = {
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
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const token = globalContext.state.adminToken


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

    let isActive = true
    const load = async () => {
      try {
        const res = await fetch(apiUrl('/admin/loadBookings'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!isActive) return

        const data = await res.json().catch(() => null)
        if (!res.ok) {
          const errorMessage = (data as { message?: string } | null)?.message ?? `HTTP ${res.status}`
          setLoadError(errorMessage)
          setBookings([])
          return
        }

        const payload = data as { bookings?: unknown } | unknown[]
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { bookings?: unknown }).bookings)
            ? (payload as { bookings: unknown[] }).bookings
            : []
        setBookings(items as AdminBooking[])
        setLoadError(null)
      } catch (err) {
        if (!isActive) return
        if (err instanceof Error) {
          setLoadError(err.message)
          setBookings([])
          return
        }
        setLoadError('Unknown error')
        setBookings([])
      }
    }

    load()
    return () => {
      isActive = false
    }
  }, [token])


  return (
    <div className="page bright admin-page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="auth-shell">
        <div className="auth-card">
          <div className="admin-topbar">
            <button
              className="book-btn admin-flat-btn"
              type="button"
              onClick={() => {
                navigate('/')
              }}
            >
              Back to home
            </button>
            <p>
              Admin Dashboard
            </p>
            <button className="book-btn admin-flat-btn"
             type="button"
             onClick={logout}>
              Logout
            </button>
          </div>
          <div>
            {loadError ? (
              <p className="subtext">{loadError}</p>
            ) : bookings.length === 0 ? (
              <p className="subtext">No bookings yet.</p>
            ) : (
              <table className="admin-bookings">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Room Type</th>
                    <th>Room #</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, index) => (
                    <tr key={booking.id ?? `${booking.guestEmail ?? 'booking'}-${index}`}>
                      <td>{booking.id ?? '-'}</td>
                      <td>{booking.roomTypeId ?? '-'}</td>
                      <td>{booking.roomNumber ?? '-'}</td>
                      <td>{booking.checkInDate ?? '-'}</td>
                      <td>{booking.checkOutDate ?? '-'}</td>
                      <td>{booking.guestName ?? '-'}</td>
                      <td>{booking.guestEmail ?? '-'}</td>
                      <td>{booking.guestPhone ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage

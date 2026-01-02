import { useEffect, useState } from 'react'
import { useGlobalContext } from '../context/globalContext'
import { apiUrl } from '../apiClient'
import type { AdminBooking } from './AdminPage'

const BookingsTable = () => {
  const { state } = useGlobalContext()
  const token = state.adminToken
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showFutureOnly, setShowFutureOnly] = useState(true)

  useEffect(() => {
    if (!token) {
      return
    }

    let isActive = true
    const load = async () => {
      try {
        const scope = showFutureOnly ? 'future' : 'all'
        const res = await fetch(apiUrl(`/admin/loadBookings?scope=${scope}`), {
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
  }, [token, showFutureOnly])

  const formatRoomLabel = (roomTypeId?: number, roomNumber?: number) => {
    if (roomTypeId != null && roomNumber != null) {
      return `t${roomTypeId}-${roomNumber}`
    }
    if (roomTypeId != null) {
      return `t${roomTypeId}-?`
    }
    if (roomNumber != null) {
      return `t?-${roomNumber}`
    }
    return '-'
  }

  if (!token) {
    return null
  }

  return (
    <>
      <div className="admin-secondary-row">
        <button
          className="book-btn admin-flat-btn admin-toggle-btn"
          type="button"
          onClick={() => {
            setShowFutureOnly((prev) => !prev)
          }}
        >
          {showFutureOnly ? 'Show all' : 'Show future'}
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
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <tr key={booking.id ?? `${booking.guestEmail ?? 'booking'}-${index}`}>
                  <td>{booking.id ?? '-'}</td>
                  <td>{formatRoomLabel(booking.roomTypeId, booking.roomNumber)}</td>
                  <td>{booking.checkInDate ?? '-'}</td>
                  <td>{booking.checkOutDate ?? '-'}</td>
                  <td>{booking.guestName ?? '-'}</td>
                  <td>{booking.guestEmail ?? '-'}</td>
                  <td>{booking.guestPhone ?? '-'}</td>
                  <td className="admin-action-cell">
                    <details className="admin-action-menu">
                      <summary className="admin-action-trigger"></summary>
                      <div className="admin-action-dropdown">
                        <button
                          className="admin-action-item"
                          type="button"
                          onClick={(event) => {
                            console.log('delete booking id:', booking.id ?? '-')
                            const details = event.currentTarget.closest('details')
                            if (details) {
                              details.removeAttribute('open')
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default BookingsTable

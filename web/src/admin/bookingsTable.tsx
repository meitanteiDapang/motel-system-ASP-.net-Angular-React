import { useEffect, useState, JSX } from 'react'
import { useGlobalContext } from '../context/globalContext'
import { apiUrl } from '../apiClient'
import type { AdminBooking } from './AdminPage'
import './bookingsTable.css'

// Present room identity even when one of the pieces is missing.
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

const BookingsTable = () => {
  const { state } = useGlobalContext()
  const token = state.adminToken
  const PAGE_SIZE = 20
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showFutureOnly, setShowFutureOnly] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState<number | null>(null)

  // Load bookings when token, scope, or page changes.
  useEffect(() => {
    if (!token) {
      return
    }

    // Prevent state updates if the component unmounts mid-request.
    let isActive = true
    const load = async () => {
      try {
        const scope = showFutureOnly ? 'future' : 'all'
        const params = new URLSearchParams({
          scope,
          page: page.toString(),
          pageSize: PAGE_SIZE.toString(),
        })
        const res = await fetch(apiUrl(`/admin/loadBookings?${params.toString()}`), {
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

        // API currently returns either an array or an object with { bookings, total }.
        const payload = data as { bookings?: unknown; total?: unknown } | unknown[]
        // Normalise payload so the rest of the component can rely on arrays/numbers.
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { bookings?: unknown }).bookings)
            ? (payload as { bookings: unknown[] }).bookings
            : []
        const totalCount =
          !Array.isArray(payload) && typeof (payload as { total?: unknown }).total === 'number'
            ? Math.max(0, Math.floor((payload as { total: number }).total))
            : null
        setBookings(items as AdminBooking[])
        setTotal(totalCount)
        setLoadError(null)
      } catch (err) {
        if (!isActive) return
        if (err instanceof Error) {
          setLoadError(err.message)
          setBookings([])
          setTotal(null)
          return
        }
        setLoadError('Unknown error')
        setBookings([])
        setTotal(null)
      }
    }

    load()
    return () => {
      isActive = false
    }
  }, [token, showFutureOnly, page])

  if (!token) {
    return null
  }

  const toggleLabel = showFutureOnly ? 'Show all' : 'Show future'
  const pageCount = total != null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null
  const isNextDisabled = total != null ? page * PAGE_SIZE >= total : bookings.length < PAGE_SIZE

  const bookingRows = bookings.map((booking, index) => (
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
  ))

  let bookingsContent: JSX.Element | null
  if (loadError) {
    bookingsContent = <p className="subtext">{loadError}</p>
  } else if (bookings.length === 0) {
    bookingsContent = <p className="subtext">No bookings yet.</p>
  } else {
    bookingsContent = (
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
        <tbody>{bookingRows}</tbody>
      </table>
    )
  }

  return (
    <>
      <div className="admin-secondary-row">
        <button
          className="book-btn admin-flat-btn admin-toggle-btn"
          type="button"
          onClick={() => {
            setPage(1)
            setShowFutureOnly((prev) => !prev)
          }}
        >
          {toggleLabel}
        </button>
      </div>
      <div>
        {bookingsContent}
      </div>
      <div className="admin-pagination">
        <button
          className="book-btn admin-flat-btn"
          type="button"
          disabled={page === 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Previous
        </button>
        <span className="admin-page-info">
          Page {page}
          {pageCount != null ? ` / ${pageCount}` : ''}
        </span>
        <button
          className="book-btn admin-flat-btn"
          type="button"
          disabled={isNextDisabled}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </>
  )
}

export default BookingsTable

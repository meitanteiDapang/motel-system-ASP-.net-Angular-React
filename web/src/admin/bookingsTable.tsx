import { useEffect, useRef, useState, JSX } from 'react'
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
  const [total, setTotal] = useState<number | null>(null)
  const bookingsCacheRef = useRef<AdminBooking[] | null>(null)
  const totalCacheRef = useRef<number | null>(null)
  const fromDateRef = useRef<string | null>(null)
  const tokenRef = useRef<string | null>(null)
  const allSinceDate = '1970-01-01'

  const getNzToday = () => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = formatter.formatToParts(new Date())
    const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
    return `${pick('year')}-${pick('month')}-${pick('day')}`
  }

  // Load bookings when token, filter, or page changes.
  useEffect(() => {
    if (!token) {
      bookingsCacheRef.current = null
      totalCacheRef.current = null
      fromDateRef.current = null
      tokenRef.current = null
      return
    }

    if (tokenRef.current !== token) {
      tokenRef.current = token
      bookingsCacheRef.current = null
      totalCacheRef.current = null
    }

    const fromDate = showFutureOnly ? getNzToday() : allSinceDate
    if (fromDateRef.current !== fromDate) {
      fromDateRef.current = fromDate
      bookingsCacheRef.current = null
      totalCacheRef.current = null
    }

    // Prevent state updates if the component unmounts mid-request.
    let isActive = true
    const load = async () => {
      try {
        const cached = bookingsCacheRef.current
        if (cached) {
          setBookings(cached)
          setTotal(totalCacheRef.current)
          setLoadError(null)
          return
        }

        const params = new URLSearchParams({
          fromCheckOutDate: fromDate,
          pageSize: PAGE_SIZE.toString(),
        })
        const res = await fetch(apiUrl(`/bookings?${params.toString()}`), {
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
        const bookingsPage = items as AdminBooking[]
        setBookings(bookingsPage)
        setTotal(totalCount)
        bookingsCacheRef.current = bookingsPage
        totalCacheRef.current = totalCount
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
  }, [token, showFutureOnly])

  if (!token) {
    return null
  }

  const toggleLabel = showFutureOnly ? 'Show all (check-out)' : 'Show future (check-out)'
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
        <span className="admin-page-info">
          Showing {bookings.length}{total != null ? ` / ${total}` : ''}
        </span>
      </div>
    </>
  )
}

export default BookingsTable

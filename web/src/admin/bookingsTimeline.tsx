import { useEffect, useMemo, useRef, useState } from 'react'
import { useGlobalContext } from '../context/globalContext'
import { apiUrl } from '../apiClient'
import type { AdminBooking } from './AdminPage'
import './bookingsTimeline.css'

const TIMELINE_PAGE_SIZE = 500

const LETTER_COLOR_MAP: Record<string, [string, string]> = {
  A: ['#f3b0c3', '#5a1032'],
  B: ['#f7c7a6', '#512400'],
  C: ['#bde3ff', '#0c2d55'],
  D: ['#c9d1ff', '#1f1f5b'],
  E: ['#c7f2d8', '#114527'],
  F: ['#ffe0b5', '#5f3200'],
  G: ['#ffd1dc', '#5a1b2c'],
  H: ['#d8f0ff', '#0b2f4e'],
  I: ['#f3e2ff', '#3a0f5a'],
  J: ['#d4f7ed', '#064633'],
  K: ['#ffe7c8', '#5a3100'],
  L: ['#e4d5ff', '#2a1457'],
  M: ['#fbe0e3', '#5a1d26'],
  N: ['#d8f8d6', '#0f4a1c'],
  O: ['#e7f0ff', '#0c2e63'],
  P: ['#f7e3c7', '#4f2c00'],
  Q: ['#f2d9ff', '#40155a'],
  R: ['#d6fff1', '#0d4636'],
  S: ['#ffe7d1', '#5c2c00'],
  T: ['#e1d8ff', '#24155d'],
  U: ['#ffdfea', '#5a1f38'],
  V: ['#d4f4ff', '#0f3f5a'],
  W: ['#f3ffe0', '#394f08'],
  X: ['#ffe0f3', '#5a1f4a'],
  Y: ['#e0ecff', '#0f2f5a'],
  Z: ['#dfffe7', '#0f4a2b'],
}

const toDateKey = (date: Date) => date.toISOString().slice(0, 10)

// Render a lightweight room label that matches the table format.
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

const getNzYesterdayUtcDate = () => {
  // Keep the UI anchored to NZ time: "yesterday" from Auckland, expressed as UTC date.
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })
  const parts = formatter.formatToParts(new Date())
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? '0')
  const nzNow = Date.UTC(
    pick('year'),
    pick('month') - 1,
    pick('day'),
    pick('hour'),
    pick('minute'),
    pick('second')
  )
  const yesterday = new Date(nzNow)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate()))
}

const parseUtcDate = (value?: string) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
}

const BookingsTimeline = () => {
  const { state } = useGlobalContext()
  const token = state.adminToken
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // Cache NZ “yesterday” date key once so we can align the timeline headers.
  const yesterdayKey = useMemo(() => toDateKey(getNzYesterdayUtcDate()), [])
  const yesterdayHeaderRef = useRef<HTMLTableCellElement | null>(null)

  // Load all bookings for the timeline when an admin token is present.
  useEffect(() => {
    if (!token) return
    // Keep track of mounted state to avoid updating after unmount.
    let isActive = true
    const load = async () => {
      try {
        let page = 1
        let total: number | null = null
        let all: AdminBooking[] = []

        while (true) {
          const params = new URLSearchParams({
            scope: 'all',
            page: page.toString(),
            pageSize: TIMELINE_PAGE_SIZE.toString(),
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

          const payload = data as { bookings?: unknown; total?: unknown } | unknown[]
          const items = Array.isArray(payload)
            ? payload
            : Array.isArray((payload as { bookings?: unknown }).bookings)
              ? (payload as { bookings: unknown[] }).bookings
              : []
          const pageTotal =
            !Array.isArray(payload) && typeof (payload as { total?: unknown }).total === 'number'
              ? (payload as { total: number }).total
              : null

          all = all.concat(items as AdminBooking[])
          total = total ?? pageTotal ?? null
          // console.log('Bookings timeline loaded page', page, 'count', items.length, 'total', total)

          const reachedTotal = total != null ? all.length >= total : items.length < TIMELINE_PAGE_SIZE
          if (items.length === 0 || reachedTotal) {
            break
          }
          page += 1
        }

        setBookings(all)
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

  // Derive rooms list, date list, and a room-date grid from raw bookings.
  const { rooms, days, grid } = useMemo(() => {
    const roomSet = new Set<string>()
    // Start the view at NZ yesterday; grow the range based on actual bookings.
    let minDate: Date = getNzYesterdayUtcDate()
    let maxDate: Date | null = null
    const occupancy = new Map<string, AdminBooking>()

    bookings.forEach((booking) => {
      const roomLabel = formatRoomLabel(booking.roomTypeId, booking.roomNumber)
      const start = parseUtcDate(booking.checkInDate)
      const end = parseUtcDate(booking.checkOutDate)
      if (!start || !end) return

      roomSet.add(roomLabel)
      // keep timeline starting at NZ yesterday, but extend earlier if bookings demand it
      if (start && minDate && start < minDate) {
        minDate = start
      }
      if (!maxDate || end > maxDate) {
        maxDate = end
      }

      let cursor = start
      // Fill the grid map so every date between check-in and check-out has the booking reference.
      while (cursor <= end) {
        const key = `${roomLabel}|${toDateKey(cursor)}`
        occupancy.set(key, booking)
        cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
      }
    })

    // Debug: observe the latest date included in the computed range.
    // console.log('Bookings timeline maxDate', maxDate?.toISOString())

    if (!maxDate) {
      return { rooms: [], days: [], grid: new Map<string, AdminBooking>() }
    }

    const daysList: Date[] = []
    const endDate = maxDate
    const startDate = minDate
    let dayCursor = startDate

    while (dayCursor <= endDate) {
      daysList.push(dayCursor)
      dayCursor = new Date(dayCursor.getTime() + 24 * 60 * 60 * 1000)
    }

    return { rooms: Array.from(roomSet.values()).sort(), days: daysList, grid: occupancy }
  }, [bookings])

  // Auto-scroll horizontally so “yesterday” column is visible on mount/update.
  useEffect(() => {
    if (!scrollContainerRef.current || !yesterdayHeaderRef.current) return
    scrollContainerRef.current.scrollLeft = yesterdayHeaderRef.current.offsetLeft
  }, [days])

  if (!token) {
    return null
  }

  if (loadError) {
    return <p className="subtext">{loadError}</p>
  }

  if (rooms.length === 0 || days.length === 0) {
    return <p className="subtext">No bookings yet.</p>
  }

  const captureYesterdayHeader = (el: HTMLTableCellElement | null) => {
    yesterdayHeaderRef.current = el
  }

  const dateHeaders = days.map((day) => {
    const key = toDateKey(day)
    const isYesterday = key === yesterdayKey
    return (
      <th
        key={key}
        className="timeline-date-col"
        ref={isYesterday ? captureYesterdayHeader : undefined}
      >
        {key}
      </th>
    )
  })

  const renderTimelineCell = (room: string, day: Date) => {
    const dateKey = toDateKey(day)
    const booking = grid.get(`${room}|${dateKey}`)
    const guestInitial =
      booking?.guestName && booking.guestName.trim().length > 0
        ? booking.guestName.trim()[0]!.toUpperCase()
        : null
    const colors = guestInitial ? LETTER_COLOR_MAP[guestInitial] : undefined
    return (
      <td
        key={`${room}-${dateKey}`}
        className="timeline-cell"
        style={
          colors
            ? {
                backgroundColor: colors[0],
                color: colors[1],
                fontWeight: 700,
              }
            : undefined
        }
      >
        {booking ? booking.guestName ?? '-' : ''}
      </td>
    )
  }

  const timelineRows = rooms.map((room) => {
    const cells = days.map((day) => renderTimelineCell(room, day))
    return (
      <tr key={room}>
        <td className="timeline-room-col">{room}</td>
        {cells}
      </tr>
    )
  })

  return (
    <div className="admin-timeline">
      <div className="admin-timeline-scroll" ref={scrollContainerRef}>
        <table className="admin-timeline-table">
          <thead>
            <tr>
              <th className="timeline-room-col">Room</th>
              {dateHeaders}
            </tr>
          </thead>
          <tbody>
            {timelineRows}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BookingsTimeline

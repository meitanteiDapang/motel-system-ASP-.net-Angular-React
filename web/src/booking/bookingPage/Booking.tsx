import { useCallback, useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useBooking } from './useBooking'
import { useRoomTypes } from '../../hooks/useRoomTypes'
import type { RoomType } from '../../types'
import './booking.css'

// Keep only digits and a single leading plus so the API receives a clean phone number.
const sanitizePhone = (raw: string): string => {
  if (!raw) return ''
  const cleaned = raw.replace(/[^\d+]/g, '')
  const hasLeadingPlus = cleaned.startsWith('+')
  const digits = cleaned.replace(/\D/g, '')
  return hasLeadingPlus ? `+${digits}` : digits
}

// Convert Date -> yyyy-mm-dd for date inputs.
const toIsoDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const Booking = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomTypes = useRoomTypes()
  const roomTypeParam = searchParams.get('roomTypeId')
  const roomTypeId = roomTypeParam ? Number(roomTypeParam) : null
  const selectedRoom: RoomType | null =
    roomTypeId !== null && Number.isFinite(roomTypeId)
      ? roomTypes.data.find((room) => room.id === roomTypeId) ?? null
      : null

  const booking = useBooking(selectedRoom?.id)
  const [localError, setLocalError] = useState('')
  const today = useMemo(() => toIsoDate(new Date()), [])
  const minCheckOutDate = useMemo(() => {
    if (!booking.form.checkInDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return toIsoDate(tomorrow)
    }
    const parsed = new Date(booking.form.checkInDate)
    if (Number.isNaN(parsed.getTime())) return today
    parsed.setDate(parsed.getDate() + 1)
    return toIsoDate(parsed)
  }, [booking.form.checkInDate, today])
  const totalPrice = useMemo(() => {
    if (!selectedRoom || !booking.form.checkInDate || !booking.form.checkOutDate) return null
    const checkIn = new Date(booking.form.checkInDate)
    const checkOut = new Date(booking.form.checkOutDate)
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return null
    if (checkOut <= checkIn) return null
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (nights <= 0) return null
    return {
      nights,
      total: nights * selectedRoom.price,
    }
  }, [booking.form.checkInDate, booking.form.checkOutDate, selectedRoom])

  const handleSuccess = useCallback(
    (bookingId: number | null) => {
      const selectedId = selectedRoom?.id ? `roomTypeId=${selectedRoom.id}` : ''
      const suffix = selectedId ? `?${selectedId}` : ''
      navigate(`/booked${suffix}`)
      return bookingId
    },
    [navigate, selectedRoom],
  )

  const handleSubmit = async (): Promise<void> => {
    setLocalError('')
    const bookingId = await booking.submit()
    if (bookingId) {
      handleSuccess(bookingId)
    } else if (!booking.error) {
      setLocalError('Booking could not be completed. Please try again.')
    }
  }

  const totalPriceText = totalPrice
    ? `Total: $${totalPrice.total} (${totalPrice.nights} night${totalPrice.nights === 1 ? '' : 's'})`
    : null
  const totalPriceNode = totalPriceText ? <p className="subtext total-price">{totalPriceText}</p> : null
  const availabilityContent = (() => {
    if (!booking.form.checkInDate || !booking.form.checkOutDate) {
      return <span>Select check-in and check-out dates to check availability.</span>
    }
    if (booking.checking) {
      return <span>Checking availability...</span>
    }
    if (booking.availabilityError) {
      return <span className="error-text">{booking.availabilityError}</span>
    }
    if (booking.availability && !booking.checking && !booking.availabilityError) {
      return (
        <span className={booking.availability.available ? 'availability-ok' : 'availability-bad'}>
          {booking.availability.available
            ? `${booking.availability.remaining} rooms left`
            : 'Sold out for these dates.'}
        </span>
      )
    }
    return null
  })()
  const errorNode =
    booking.error || localError ? (
      <p className="subtext error-text">{booking.error || localError}</p>
    ) : null
  const successNode = booking.success ? <p className="subtext success-text">{booking.success}</p> : null
  const bookingButtonText = booking.submitting ? 'Booking...' : 'Confirm booking'
  const bookingButtonDisabled =
    booking.submitting ||
    booking.checking ||
    !booking.form.checkInDate ||
    !booking.form.checkOutDate ||
    booking.availability?.available === false

  let bookingCardContent: JSX.Element
  if (roomTypes.loading) {
    bookingCardContent = <p className="subtext">Loading room details...</p>
  } else if (roomTypes.error) {
    bookingCardContent = (
      <p className="subtext error-text">Failed to load room details: {roomTypes.error.message}</p>
    )
  } else if (!selectedRoom) {
    bookingCardContent = <p className="subtext">Room type not found. Please go back and try again.</p>
  } else {
    bookingCardContent = (
      <div className="booking-grid">
        <div className="booking-summary">
          <div className="img-wrap square">
            <img src={selectedRoom.imageUrl} alt={selectedRoom.typeName} />
          </div>
          <h2>{selectedRoom.typeName}</h2>
          <p>
            {selectedRoom.bedNumber} beds · ${selectedRoom.price}
          </p>
          <p className="subtext">
            Pick your check-in and check-out dates and leave your contact details. We will hold the
            room after booking.
          </p>
        </div>

        <div className="booking-form">
          <div className="field-group">
            <label className="field">
              <span>Check-in</span>
              <input
                type="date"
                value={booking.form.checkInDate}
                min={today}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  booking.setField('checkInDate', event.target.value)
                }
              />
            </label>
            <label className="field">
              <span>Check-out</span>
              <input
                type="date"
                value={booking.form.checkOutDate}
                min={minCheckOutDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  booking.setField('checkOutDate', event.target.value)
                }
              />
            </label>
          </div>
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={booking.form.name}
              onChange={(event: ChangeEvent<HTMLInputElement>) => booking.setField('name', event.target.value)}
              placeholder="Your full name"
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={booking.form.email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => booking.setField('email', event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span>Phone</span>
            <input
              type="tel"
              value={booking.form.phone}
              inputMode="tel"
              pattern="[+0-9]*"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                booking.setField('phone', sanitizePhone(event.target.value))
              }
              placeholder="11 111 1111"
            />
          </label>

          {totalPriceNode}

          <div className="availability">{availabilityContent}</div>

          {errorNode}
          {successNode}

          <button className="book-btn primary" type="button" onClick={handleSubmit} disabled={bookingButtonDisabled}>
            {bookingButtonText}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-page">
      <div className="booking-header">
        <button
          className="back-btn"
          type="button"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
        <div>
          <p className="eyebrow">Booking</p>
          <h1>Reserve your stay</h1>
        </div>
      </div>

      <div className="booking-card">
        {bookingCardContent}
      </div>
    </div>
  )
}

export default Booking

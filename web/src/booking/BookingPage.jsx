import { useEffect, useMemo, useState } from 'react'
import { useBooking } from './useBooking.js'

const sanitizePhone = (raw) => {
  if (!raw) return ''
  const cleaned = raw.replace(/[^\d+]/g, '')
  const hasLeadingPlus = cleaned.startsWith('+')
  const digits = cleaned.replace(/\D/g, '')
  return hasLeadingPlus ? `+${digits}` : digits
}

const BookingPage = ({ roomType, loading, error, onBack, onSuccess }) => {
  const booking = useBooking(roomType?.id)
  const [localError, setLocalError] = useState('')
  const [redirected, setRedirected] = useState(false)
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  useEffect(() => {
    if (!redirected && booking.success) {
      setRedirected(true)
      onSuccess?.()
    }
  }, [booking.success, onSuccess, redirected])

  const handleSubmit = async () => {
    setLocalError('')
    const bookingId = await booking.submit()
    if (bookingId) {
      setRedirected(true)
      onSuccess?.(bookingId)
    } else if (!booking.error) {
      setLocalError('Booking could not be completed. Please try again.')
    }
  }

  return (
    <div className="booking-page">
      <div className="booking-header">
        <button className="back-btn" type="button" onClick={onBack}>
          Back to rooms
        </button>
        <div>
          <p className="eyebrow">Booking</p>
          <h1>Reserve your stay</h1>
        </div>
      </div>

      <div className="booking-card">
        {loading && <p className="subtext">Loading room details...</p>}
        {error && (
          <p className="subtext error-text">Failed to load room details: {error.message}</p>
        )}
        {!loading && !error && !roomType && (
          <p className="subtext">Room type not found. Please go back and try again.</p>
        )}
        {!loading && !error && roomType && (
          <div className="booking-grid">
            <div className="booking-summary">
              <div className="img-wrap square">
                <img src={roomType.imageUrl} alt={roomType.typeName} />
              </div>
              <h2>{roomType.typeName}</h2>
              <p>
                {roomType.bedNumber} beds · ${roomType.price} · {roomType.availableRoomsNumber} rooms
              </p>
              <p className="subtext">
                Pick a date and leave your contact details. We will hold the room after booking.
              </p>
            </div>

            <div className="booking-form">
              <label className="field">
                <span>Date</span>
                <input
                  type="date"
                  value={booking.form.date}
                  min={today}
                  onChange={(event) => booking.setField('date', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  value={booking.form.name}
                  onChange={(event) => booking.setField('name', event.target.value)}
                  placeholder="Your full name"
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={booking.form.email}
                  onChange={(event) => booking.setField('email', event.target.value)}
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
                  onChange={(event) =>
                    booking.setField('phone', sanitizePhone(event.target.value))
                  }
                  placeholder="+64 9 555 4321"
                />
              </label>

              <div className="availability">
                {!booking.form.date && <span>Select a date to check availability.</span>}
                {booking.checking && <span>Checking availability...</span>}
                {booking.availabilityError && (
                  <span className="error-text">{booking.availabilityError}</span>
                )}
                {booking.availability && !booking.checking && !booking.availabilityError && (
                  <span
                    className={
                      booking.availability.available ? 'availability-ok' : 'availability-bad'
                    }
                  >
                    {booking.availability.available
                      ? `${booking.availability.remaining} rooms left`
                      : 'Sold out for this date.'}
                  </span>
                )}
              </div>

              {(booking.error || localError) && (
                <p className="subtext error-text">{booking.error || localError}</p>
              )}
              {booking.success && <p className="subtext success-text">{booking.success}</p>}

              <button
                className="book-btn primary"
                type="button"
                onClick={handleSubmit}
                disabled={
                  booking.submitting ||
                  booking.checking ||
                  (booking.availability && !booking.availability.available)
                }
              >
                {booking.submitting ? 'Booking...' : 'Confirm booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingPage

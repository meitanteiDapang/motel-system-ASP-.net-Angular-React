import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRoomTypes } from '../../hooks/useRoomTypes'
import type { RoomType } from '../../types'
import '../bookingPage/booking.css'

const BookingSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomTypes = useRoomTypes()

  const roomTypeParam = searchParams.get('roomTypeId')
  const roomTypeId = roomTypeParam ? Number(roomTypeParam) : null
  const selectedRoom: RoomType | null =
    roomTypeId !== null && Number.isFinite(roomTypeId)
      ? roomTypes.data.find((room) => room.id === roomTypeId) ?? null
      : null
  const confirmationCopy = selectedRoom
    ? `${selectedRoom.typeName} is booked. We will reach out with the final details.`
    : 'We will reach out with the final details.'

  return (
    <div className="booking-page">
      <div className="booking-header">
        <button
          className="back-btn"
          type="button"
          onClick={() => navigate('/')}
        >
          Back to home
        </button>
        <div>
          <p className="eyebrow">Booking</p>
          <h1>Booking confirmed</h1>
        </div>
      </div>

      <div className="booking-card booking-success">
        <h2>Your reservation is locked in.</h2>
        <p className="subtext">{confirmationCopy}</p>
        <button className="book-btn primary" type="button" onClick={() => navigate('/')}>
          Back to homepage
        </button>
      </div>
    </div>
  )
}

export default BookingSuccess

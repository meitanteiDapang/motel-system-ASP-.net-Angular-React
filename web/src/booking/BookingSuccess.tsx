import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRoomTypes } from '../hooks/useRoomTypes'
import type { RoomType } from '../types'
import './booking.css'

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
        {selectedRoom ? (
          <p className="subtext">
            {selectedRoom.typeName} is booked. We will reach out with the final details.
          </p>
        ) : (
          <p className="subtext">We will reach out with the final details.</p>
        )}
        <button className="book-btn primary" type="button" onClick={() => navigate('/')}>
          Back to homepage
        </button>
      </div>
    </div>
  )
}

export default BookingSuccess

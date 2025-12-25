const BookingSuccessPage = ({ roomType, onBack }) => {
  return (
    <div className="booking-page">
      <div className="booking-header">
        <button className="back-btn" type="button" onClick={onBack}>
          Back to home
        </button>
        <div>
          <p className="eyebrow">Booking</p>
          <h1>Booking confirmed</h1>
        </div>
      </div>

      <div className="booking-card booking-success">
        <h2>Your reservation is locked in.</h2>
        {roomType ? (
          <p className="subtext">
            {roomType.typeName} is booked. We will reach out with the final details.
          </p>
        ) : (
          <p className="subtext">We will reach out with the final details.</p>
        )}
        <button className="book-btn primary" type="button" onClick={onBack}>
          Back to homepage
        </button>
      </div>
    </div>
  )
}

export default BookingSuccessPage

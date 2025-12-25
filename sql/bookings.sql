CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  room_type_id INTEGER NOT NULL REFERENCES room_types(id),
  booking_date DATE NOT NULL,
  guest_name VARCHAR(120) NOT NULL,
  guest_email VARCHAR(200) NOT NULL,
  guest_phone VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bookings_room_date_idx
  ON bookings (room_type_id, booking_date);

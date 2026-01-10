CREATE TABLE IF NOT EXISTS booked_rooms (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  room_type_id INTEGER NOT NULL REFERENCES room_types(id),
  room_number INTEGER NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (check_out_date > check_in_date),
  UNIQUE (booking_id),
  UNIQUE (room_type_id, room_number, check_in_date, check_out_date)
);

CREATE INDEX IF NOT EXISTS booked_rooms_booking_id_room_number_idx
  ON booked_rooms (booking_id, room_number);

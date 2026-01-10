CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  room_type_id INTEGER NOT NULL REFERENCES room_types(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guest_name VARCHAR(120) NOT NULL,
  guest_email VARCHAR(200) NOT NULL,
  guest_phone VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (check_out_date > check_in_date)
);


CREATE INDEX IF NOT EXISTS bookings_check_out_id_idx
  ON bookings (check_out_date, id)
  INCLUDE (check_in_date, room_type_id, guest_name, guest_email, guest_phone);

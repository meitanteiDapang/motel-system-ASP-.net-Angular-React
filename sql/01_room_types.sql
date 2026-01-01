CREATE TABLE IF NOT EXISTS room_types (
  id INTEGER PRIMARY KEY,
  price NUMERIC(10, 2) NOT NULL,
  bed_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  type_name VARCHAR(100) NOT NULL,
  available_rooms_number INTEGER NOT NULL
);

INSERT INTO room_types (id, price, bed_number, image_url, type_name, available_rooms_number) VALUES
  (1, 189.00, 1, 'https://storageecommerce629.blob.core.windows.net/room-images/room_type1.jpg', 'Sunrise Single', 6),
  (2, 249.00, 2, 'https://storageecommerce629.blob.core.windows.net/room-images/room_type2.jpg', 'Ocean Queen', 3),
  (3, 319.00, 2, 'https://storageecommerce629.blob.core.windows.net/room-images/room_type3.jpg', 'Neon Suite', 2),
  (4, 379.00, 3, 'https://storageecommerce629.blob.core.windows.net/room-images/room_type4.jpg', 'Penthouse Paw', 1);

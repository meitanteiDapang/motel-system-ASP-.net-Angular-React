import { apiUrl } from '../apiClient'

export const fetchAvailability = async ({ roomTypeId, date }) => {
  const params = new URLSearchParams({ date })
  const res = await fetch(apiUrl(`/room-types/${roomTypeId}/availability?${params.toString()}`))
  if (!res.ok) {
    throw new Error(`Failed to check availability (HTTP ${res.status})`)
  }
  return res.json()
}

export const createBooking = async ({ roomTypeId, date, name, email, phone }) => {
  const res = await fetch(apiUrl('/bookings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomTypeId,
      bookingDate: date,
      guestName: name,
      guestEmail: email,
      guestPhone: phone,
    }),
  })

  if (res.ok) {
    return res.json()
  }

  if (res.status === 409) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || 'This room type is sold out for the selected date.')
  }

  const errorText = await res.text().catch(() => '')
  throw new Error(errorText || `Failed to create booking (HTTP ${res.status})`)
}

import { apiUrl } from '../../apiClient'
import type { Availability, BookingResult } from '../../types'

interface AvailabilityParams {
  roomTypeId: number
  checkInDate: string
  checkOutDate: string
}

interface CreateBookingPayload {
  roomTypeId: number
  checkInDate: string
  checkOutDate: string
  name: string
  email: string
  phone: string
}

export const requestAvailability = async ({
  roomTypeId,
  checkInDate,
  checkOutDate,
}: AvailabilityParams): Promise<Availability> => {
  const params = new URLSearchParams({ checkInDate, checkOutDate })
  const res = await fetch(apiUrl(`/room-types/${roomTypeId}/availability?${params.toString()}`))
  if (!res.ok) {
    throw new Error(`Failed to check availability (HTTP ${res.status})`)
  }
  return res.json()
}

export const requestCreateBooking = async ({
  roomTypeId,
  checkInDate,
  checkOutDate,
  name,
  email,
  phone,
}: CreateBookingPayload): Promise<BookingResult> => {
  const res = await fetch(apiUrl('/bookings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomTypeId,
      checkInDate,
      checkOutDate,
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
    throw new Error(data?.message || 'This room type is sold out for the selected dates.')
  }

  const errorText = await res.text().catch(() => '')
  throw new Error(errorText || `Failed to create booking (HTTP ${res.status})`)
}

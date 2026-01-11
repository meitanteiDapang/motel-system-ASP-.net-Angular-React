import { useEffect, useState } from 'react'
import { requestAvailability, requestCreateBooking } from './bookingApi'
import type { Availability } from '../../types'

interface BookingForm {
  checkInDate: string
  checkOutDate: string
  name: string
  email: string
  phone: string
}

interface UseBookingResult {
  form: BookingForm
  setField: <K extends keyof BookingForm>(field: K, value: BookingForm[K]) => void
  availability: Availability | null
  checking: boolean
  submitting: boolean
  error: string
  availabilityError: string
  success: string
  submit: () => Promise<number | null>
}

export const useBooking = (roomTypeId?: number | null): UseBookingResult => {
  const [form, setForm] = useState<BookingForm>({
    checkInDate: '',
    checkOutDate: '',
    name: '',
    email: '',
    phone: '',
  })
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!roomTypeId || !form.checkInDate || !form.checkOutDate) {
      setAvailability(null)
      setAvailabilityError('')
      return
    }

    const checkIn = new Date(form.checkInDate)
    const checkOut = new Date(form.checkOutDate)

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      setAvailability(null)
      setAvailabilityError('Please select valid dates.')
      return
    }

    if (checkOut <= checkIn) {
      setAvailability(null)
      setAvailabilityError('Check-out must be after check-in.')
      return
    }

    const controller = new AbortController()
    const checkAvailability = async () => {
      setChecking(true)
      setAvailabilityError('')
      try {
        const data = await requestAvailability({
          roomTypeId,
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
        })
        if (!controller.signal.aborted) {
          setAvailability(data)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          // Coerce unknown errors into a string-friendly Error for UI display.
          const message = err instanceof Error ? err.message : 'Failed to check availability.'
          setAvailability(null)
          setAvailabilityError(message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false)
        }
      }
    }

    checkAvailability()
    return () => controller.abort()
  }, [roomTypeId, form.checkInDate, form.checkOutDate])

  const setField = <K extends keyof BookingForm>(field: K, value: BookingForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const submit = async (): Promise<number | null> => {
    setError('')
    setSuccess('')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (roomTypeId == null) {
      setError('Please select a room type first.')
      return null
    }

    if (!form.checkInDate || !form.checkOutDate || !form.name || !form.email || !form.phone) {
      setError('Please fill out check-in, check-out, name, email, and phone.')
      return null
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(form.email)) {
      setError('Please enter a valid email address.')
      return null
    }

    const checkInDate = new Date(form.checkInDate)
    const checkOutDate = new Date(form.checkOutDate)
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      setError('Please select valid dates.')
      return null
    }

    if (checkInDate < today) {
      setError('Please select a future check-in date.')
      return null
    }

    if (checkOutDate <= checkInDate) {
      setError('Check-out must be after check-in.')
      return null
    }

    if (availability && !availability.available) {
      setError('This room type is sold out for the selected dates.')
      return null
    }

    setSubmitting(true)
    try {
      const result = await requestCreateBooking({
        roomTypeId,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        name: form.name,
        email: form.email,
        phone: form.phone,
      })
      const roomNote = result?.roomNumber ? ` Room #${result.roomNumber} reserved.` : ''
      setSuccess(`Booking confirmed. We will reach out shortly.${roomNote}`)
      return result?.id ?? null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking.'
      setError(message)
    } finally {
      setSubmitting(false)
    }

    return null
  }

  return {
    form,
    setField,
    availability,
    checking,
    submitting,
    error,
    availabilityError,
    success,
    submit,
  }
}

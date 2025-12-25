import { useEffect, useState } from 'react'
import { createBooking, fetchAvailability } from './bookingApi.js'

export const useBooking = (roomTypeId) => {
  const [form, setForm] = useState({
    date: '',
    name: '',
    email: '',
    phone: '',
  })
  const [availability, setAvailability] = useState(null)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!roomTypeId || !form.date) {
      setAvailability(null)
      setAvailabilityError('')
      return
    }

    const controller = new AbortController()
    const checkAvailability = async () => {
      setChecking(true)
      setAvailabilityError('')
      try {
        const data = await fetchAvailability({ roomTypeId, date: form.date })
        if (!controller.signal.aborted) {
          setAvailability(data)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setAvailabilityError(err.message || 'Failed to check availability.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false)
        }
      }
    }

    checkAvailability()
    return () => controller.abort()
  }, [roomTypeId, form.date])

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const submit = async () => {
    setError('')
    setSuccess('')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (!roomTypeId) {
      setError('Please select a room type first.')
      return
    }

    if (!form.date || !form.name || !form.email || !form.phone) {
      setError('Please fill out date, name, email, and phone.')
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }

    const chosenDate = new Date(form.date)
    if (Number.isNaN(chosenDate.getTime()) || chosenDate < today) {
      setError('Please select a future date.')
      return
    }

    if (availability && !availability.available) {
      setError('This room type is sold out for the selected date.')
      return
    }

    setSubmitting(true)
    try {
      const result = await createBooking({
        roomTypeId,
        date: form.date,
        name: form.name,
        email: form.email,
        phone: form.phone,
      })
      setSuccess('Booking confirmed. We will reach out shortly.')
      return result?.id ?? null
    } catch (err) {
      setError(err.message || 'Failed to create booking.')
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

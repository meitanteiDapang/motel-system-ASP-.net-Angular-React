import { Route, Routes } from 'react-router-dom'
import AdminLogin from './admin/adminLogin/AdminLogin'
import AdminPage from './admin/adminPage/AdminPage'
import Booking from './booking/bookingPage/Booking'
import BookingSuccess from './booking/success/BookingSuccess'
import HomePage from './home/HomePage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/book" element={<Booking />} />
      <Route path="/booked" element={<BookingSuccess />} />
      <Route path="/adminLogin" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

export default App

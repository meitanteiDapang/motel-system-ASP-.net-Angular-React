import { useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../context/globalContext'
import './AdminShared.css'
import './AdminPage.css'
import { useEffect, useState } from 'react'
import { apiUrl } from '../apiClient'


const AdminPage = () => {
  const navigate = useNavigate()
  const globalContext = useGlobalContext()
  const [adminTestMessage, setAdminTestMessage] = useState('')
  const token = globalContext.state.adminToken


  const logout = ()=>{
    globalContext.globalDispatch({
      type: 'clearAdminToken'
    })
    navigate('/')
  }


  useEffect(()=>{
    if (!token) {
      console.log("no token!")
      return
    }

    let isActive = true
    const load = async () => {
      try {
        const res = await fetch(apiUrl('/admin/loadBookings'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!isActive) return

        const data = await res.json().catch(() => null)
        if (res.ok) {
          const message = (data as { message?: string } | null)?.message ?? 'ok'
          setAdminTestMessage(message)
          return
        }

        const errorMessage = (data as { message?: string } | null)?.message ?? `HTTP ${res.status}`
        setAdminTestMessage(errorMessage)
      } catch (err) {
        if (!isActive) return
        if (err instanceof Error) {
          setAdminTestMessage(err.message)
          return
        }
        setAdminTestMessage('Unknown error')
      }
    }

    load()
    return () => {
      isActive = false
    }
  }, [token])


  return (
    <div className="page bright admin-page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="auth-shell">
        <div className="auth-card">
          <div className="admin-topbar">
            <button
              className="book-btn admin-flat-btn"
              type="button"
              onClick={() => {
                navigate('/')
              }}
            >
              Back to home
            </button>
            <p>
              Admin Dashboard
            </p>
            <button className="book-btn admin-flat-btn"
             type="button"
             onClick={logout}>
              Logout
            </button>
          </div>
          <div>
            <div className="testing-panel">
              <p className="subtext">Testing panel</p>
              <p className="subtext">{globalContext.state.adminToken}</p>
              <p className="subtext">{token ? adminTestMessage : 'no admin token'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage

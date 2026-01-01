import { useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../context/globalContext'
import './AdminShared.css'
import './AdminPage.css'
import { useEffect } from 'react'


const AdminPage = () => {
  const navigate = useNavigate()
  const globalContext = useGlobalContext()


  useEffect(()=>{
    
  })


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
            <button className="book-btn admin-flat-btn" type="button">
              Logout
            </button>
          </div>
          <div>
            <div className="testing-panel">
              <p className="subtext">Testing panel</p>
              <p className="subtext">{globalContext.state.adminToken}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage

import { useNavigate } from 'react-router-dom'
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useAdminLogin } from './useAdminLogin'
import { useGlobalContext } from '../../context/globalContext'
import '../adminPage/AdminShared.css'

const AdminLogin = () => {
  const navigate = useNavigate()
  const { state, globalDispatch } = useGlobalContext()
  const token = state.adminToken
  const [username, setUsername] = useState<string>('admin')
  const [password, setPassword] = useState<string>('ps^word')
  const [errorText, setErrorText] = useState<string>('')
  const adminLogin = useAdminLogin(username, password)

  // On mount, if a token exists, verify and redirect without asking user to log in again.
  useEffect(() => {
    // If we already have a stored token, silently verify it and redirect.
    // Doing this in the UI avoids an extra login for returning admins.
    if (!token) return
    let cancelled = false
    const verify = async () => {
      const valid = await adminLogin.checkAdminToken(token)
      if (!cancelled && valid) {
        navigate('/admin')
      }
    }
    verify()
    return () => {
      cancelled = true
    }
  }, [navigate, adminLogin, token])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Do not clear any previous error until we know the result.
    const res = await adminLogin.submit()
    if (res.success) {
      if (res.token) {
        globalDispatch({ type: 'setAdminToken', token: res.token })
      } else {
        setErrorText('Token fetch failed, please try again later.')
        return
      }
      // Replace to avoid stacking login page in history after redirect.
      navigate('/admin', { replace: true })
    } else {
      setErrorText(res.message ?? 'Unknown error')
    }
  }

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value)
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }

  const handleBack = () => {
    navigate('/')
  }

  const errorNode = errorText ? (
    <p className="subtext" style={{ color: 'red' }}>
      {errorText}
    </p>
  ) : null

  return (
    <div className="page bright admin-page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="auth-shell">
        <div className="auth-card">
          <div>
            <p className="eyebrow">Admin access</p>
            <h2>Sign in to manage Dapang motel</h2>
            <p className="subtext">
              Enter your credentials to reach the admin console.
            </p>
            {errorNode}
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              Username
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
              />
            </label>
            <label className="field">
              Password
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
              />
            </label>
            <button className="book-btn primary" type="submit">
              Enter admin
            </button>
            <button className="ghost-btn" type="button" onClick={handleBack}>
              Back to homepage
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin

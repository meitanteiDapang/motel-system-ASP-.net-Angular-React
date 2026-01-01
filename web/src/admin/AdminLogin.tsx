import { useNavigate } from 'react-router-dom'
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useAdminLogin } from './useAdminLogin'
import { useGlobalContext } from '../context/globalContext'
import './AdminShared.css'





const AdminLogin = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string>('admin')
  const [password, setPassword] = useState<string>('ps^word')
  const [errorText, setErrorText] = useState<string>('')
  const { globalDispatch } = useGlobalContext()

  const globalContext = useGlobalContext()
  const token = globalContext.state.adminToken


  const adminLogin = useAdminLogin(username, password)




  useEffect(() => {

      const verifyToken = async (): Promise<boolean> =>{
    if(!token){
      return false
    } else {
      const tokenVerifed = await adminLogin.checkAdminToken(token);
      return tokenVerifed
    }

  }

    const run = async () => {
      if (await verifyToken()) {
        navigate('/admin')
      }
    }
    run()
  }, [navigate, adminLogin, token])







  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const res = await adminLogin.submit()
    if (res.success) {
      if (res.token){
        globalDispatch({ type: 'setAdminToken', token: res.token })
      } else {
        setErrorText('Token fetch failed, please try again later.')
        return
      }


      navigate('/admin')
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
            {errorText && (
              <p className="subtext" style={{ color: 'red' }}>
                {errorText}
              </p>
            )}
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

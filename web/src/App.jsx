import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/info')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setInfo(data)
      } catch (err) {
        setError(err.message || 'Request failed')
      }
    }
    load()
  }, [])

  return (
    <main className="app">
      <section className="card">
        <h1>E-commerce Web</h1>
        <p>Simple check that the web frontend can reach the API.</p>
        <div className="status">
          <div className="label">API response:</div>
          {info && <code className="pill">{JSON.stringify(info)}</code>}
          {error && <code className="pill error">{error}</code>}
          {!info && !error && <span>Loading...</span>}
        </div>
      </section>
    </main>
  )
}

export default App

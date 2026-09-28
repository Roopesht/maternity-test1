import { useEffect, useState } from 'react'
import './App.css'

type BackendStatus = 'checking' | 'online' | 'offline'

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then((res) => (res.ok ? setBackendStatus('online') : setBackendStatus('offline')))
      .catch(() => setBackendStatus('offline'))
  }, [])

  return (
    <main className="dashboard">
      <header>
        <h1>Maternal Care Platform</h1>
        <p>Multi-Tenant PaaS/SaaS for Hospital Antenatal, Labour Room &amp; Delivery Management</p>
      </header>

      <section className="status">
        <h2>Welcome</h2>
      </section>
    </main>
  )
}

export default App

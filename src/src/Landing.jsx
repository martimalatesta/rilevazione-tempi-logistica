import { useNavigate } from 'react-router-dom'
import { LogIn, LogOut } from 'lucide-react'
import { getOperatorId } from './shared.jsx'
import { useState } from 'react'

export default function Landing() {
  const navigate = useNavigate()
  const [operatorId] = useState(getOperatorId)

  return (
    <div className="app">
      <header className="header">
        <span className="header-title">Rilevazione Tempi</span>
        <span className="operator-chip">{operatorId}</span>
      </header>

      <main className="main landing-main">
        <button className="landing-btn landing-btn--in" onClick={() => navigate('/in')}>
          <LogIn size={40} strokeWidth={2} />
          <span className="landing-btn-label">IN</span>
          <span className="landing-btn-sub">Ricevimento merce</span>
        </button>

        <button className="landing-btn landing-btn--out" onClick={() => navigate('/out')}>
          <LogOut size={40} strokeWidth={2} />
          <span className="landing-btn-label">OUT</span>
          <span className="landing-btn-sub">Prelievo e consolidazione</span>
        </button>
      </main>
    </div>
  )
}

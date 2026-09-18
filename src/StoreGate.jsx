import { useState } from 'react'
import { useStore } from './StoreContext.jsx'

export default function StoreGate({ children }) {
  const { storeName, setStoreName } = useStore()
  const [value, setValue] = useState('')

  if (storeName) return children

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <span className="header-title">Rilevazione Tempi</span>
        </div>
      </header>
      <main className="main">
        <div className="summary">
          <p className="section-label">Nome negozio</p>
          <p className="fields-intro">
            Inserisci il nome del negozio in cui verranno registrate le rilevazioni. Potrai modificarlo in qualsiasi
            momento.
          </p>
          <input
            type="text"
            className="field-input"
            placeholder="Es. Milano Centro"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="cta-btn" disabled={!value.trim()} onClick={() => setStoreName(value.trim())} style={{ marginTop: 16 }}>
            Conferma
          </button>
        </div>
      </main>
    </div>
  )
}

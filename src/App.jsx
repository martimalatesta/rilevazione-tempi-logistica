import { useState, useEffect, useRef } from 'react'

// URL della Web App Google Apps Script (endpoint che scrive sul Google Sheet)
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxtWFazVBNKDSC_VBAk8X2Ro7OYgRaI58pkx3A9EzEwrd5kZ83vYXQklwCkHx0nb8JzZA/exec'

const ACTIVITIES = ['Scarico', 'Spunta', 'Riconta', 'Messa a banco', 'Smaltimento imballaggi']

function getOperatorId() {
  const key = 'rt_operator_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = 'OP-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    localStorage.setItem(key, id)
  }
  return id
}

function formatClock(date) {
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatElapsed(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}

function durataMinuti(start, end) {
  return Math.round(((end.getTime() - start.getTime()) / 60000) * 100) / 100
}

export default function App() {
  const [operatorId] = useState(getOperatorId)
  const [activity, setActivity] = useState(null)
  const [status, setStatus] = useState('idle') // idle | running | stopped
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [note, setNote] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', message }
  const noteRef = useRef(null)

  useEffect(() => {
    if (status !== 'running' || !startTime) return
    const interval = setInterval(() => setElapsed(Date.now() - startTime.getTime()), 1000)
    return () => clearInterval(interval)
  }, [status, startTime])

  function selectActivity(a) {
    if (status !== 'idle') return
    setActivity(a)
  }

  function start() {
    if (!activity) return
    setStartTime(new Date())
    setElapsed(0)
    setStatus('running')
  }

  function stop() {
    setEndTime(new Date())
    setStatus('stopped')
    setTimeout(() => noteRef.current?.focus(), 50)
  }

  function reset() {
    setActivity(null)
    setStatus('idle')
    setStartTime(null)
    setEndTime(null)
    setNote('')
    setElapsed(0)
    setFeedback(null)
  }

  async function save() {
    if (!startTime || !endTime) return
    setSaving(true)
    setFeedback(null)

    const payload = {
      operatore: operatorId,
      attivita: activity,
      oraInizio: formatClock(startTime),
      oraFine: formatClock(endTime),
      durata: durataMinuti(startTime, endTime),
      note: note.trim(),
    }

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data && data.result === 'success') {
        setFeedback({ type: 'success', message: 'Salvato nel foglio' })
        setTimeout(reset, 1100)
      } else {
        setFeedback({ type: 'error', message: 'Salvataggio non riuscito. Riprova.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Nessuna connessione. Riprova.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <span className="header-title">Rilevazione Tempi</span>
        <span className="operator-chip">{operatorId}</span>
      </header>

      <main className="main">
        {status !== 'running' && (
          <section>
            <p className="section-label">Scegli l&rsquo;attività</p>
            <div className="activity-list">
              {ACTIVITIES.map((a) => (
                <button
                  key={a}
                  className={`activity-row ${activity === a ? 'is-selected' : ''}`}
                  disabled={status === 'stopped'}
                  onClick={() => selectActivity(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </section>
        )}

        {activity && status === 'idle' && (
          <button className="cta-btn" onClick={start}>
            Avvia
          </button>
        )}

        {status === 'running' && (
          <div className="timer-hero">
            <div className="timer-top">
              <span className="live-dot" />
              <span className="timer-activity">{activity}</span>
            </div>
            <div className="timer-display">{formatElapsed(elapsed)}</div>
            <button className="cta-btn cta-btn--stop" onClick={stop}>
              Ferma
            </button>
          </div>
        )}

        {status === 'stopped' && (
          <div className="summary">
            <div className="summary-row">
              <span>Inizio</span>
              <strong>{formatClock(startTime)}</strong>
            </div>
            <div className="summary-row">
              <span>Fine</span>
              <strong>{formatClock(endTime)}</strong>
            </div>
            <div className="summary-row">
              <span>Durata</span>
              <strong>{durataMinuti(startTime, endTime)} min</strong>
            </div>

            <textarea
              ref={noteRef}
              className="note-input"
              placeholder="Note (facoltativo)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {feedback && <div className={`feedback feedback--${feedback.type}`}>{feedback.message}</div>}

            <div className="button-row">
              <button className="ghost-btn" onClick={reset} disabled={saving}>
                Annulla
              </button>
              <button className="cta-btn" onClick={save} disabled={saving}>
                {saving ? 'Salvataggio…' : 'Salva'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

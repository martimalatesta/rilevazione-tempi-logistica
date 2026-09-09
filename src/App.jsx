import { useState, useEffect, useRef } from 'react'
import { Truck, ClipboardCheck, RotateCcw, PackageCheck, Trash2, Pause, Play, Square, Camera, X } from 'lucide-react'

// URL della Web App Google Apps Script (endpoint che scrive sul Google Sheet e, per Messa a banco, su Drive)
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxtWFazVBNKDSC_VBAk8X2Ro7OYgRaI58pkx3A9EzEwrd5kZ83vYXQklwCkHx0nb8JzZA/exec'

const ACTIVITIES = [
  { name: 'Scarico', icon: Truck },
  { name: 'Spunta', icon: ClipboardCheck },
  { name: 'Riconta', icon: RotateCcw },
  { name: 'Messa a banco', icon: PackageCheck },
  { name: 'Smaltimento imballaggi', icon: Trash2 },
]

const PHOTO_ACTIVITY = 'Messa a banco'

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

// Ridimensiona/comprime la foto lato client prima dell'invio, per upload veloci anche con rete debole
function resizeImage(file, maxWidth = 1280, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function App() {
  const [operatorId] = useState(getOperatorId)
  const [activity, setActivity] = useState(null)
  const [status, setStatus] = useState('idle') // idle | running | paused | stopped
  const [startWallClock, setStartWallClock] = useState(null)
  const [endWallClock, setEndWallClock] = useState(null)
  const [accumulatedMs, setAccumulatedMs] = useState(0)
  const [displayElapsed, setDisplayElapsed] = useState(0)
  const [note, setNote] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const runStartRef = useRef(null)
  const fileInputRef = useRef(null)
  const noteRef = useRef(null)

  // Timer live: aggiorna il display ogni secondo mentre è "running"
  useEffect(() => {
    if (status !== 'running') return
    const tick = () => setDisplayElapsed(accumulatedMs + (Date.now() - runStartRef.current))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [status, accumulatedMs])

  function selectActivity(act) {
    if (status !== 'idle') return
    const now = new Date()
    setActivity(act)
    setStartWallClock(now)
    runStartRef.current = now.getTime()
    setAccumulatedMs(0)
    setDisplayElapsed(0)
    setStatus('running')
  }

  function pause() {
    if (status !== 'running') return
    const now = Date.now()
    setAccumulatedMs((prev) => prev + (now - runStartRef.current))
    setStatus('paused')
  }

  function resume() {
    if (status !== 'paused') return
    runStartRef.current = Date.now()
    setStatus('running')
  }

  function stop() {
    const now = Date.now()
    setAccumulatedMs((prev) => {
      const total = status === 'running' ? prev + (now - runStartRef.current) : prev
      setDisplayElapsed(total)
      return total
    })
    setEndWallClock(new Date())
    setStatus('stopped')
    setTimeout(() => noteRef.current?.focus(), 50)
  }

  function cancelEntry() {
    setActivity(null)
    setStatus('idle')
    setStartWallClock(null)
    setEndWallClock(null)
    setAccumulatedMs(0)
    setDisplayElapsed(0)
    setNote('')
    setPhotoDataUrl(null)
    setFeedback(null)
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await resizeImage(file)
      setPhotoDataUrl(dataUrl)
    } catch {
      setFeedback({ type: 'error', message: 'Foto non valida. Riprova.' })
    }
  }

  async function save() {
    setSaving(true)
    setFeedback(null)

    const durata = Math.round((accumulatedMs / 60000) * 100) / 100
    const payload = {
      operatore: operatorId,
      attivita: activity.name,
      oraInizio: formatClock(startWallClock),
      oraFine: formatClock(endWallClock),
      durata,
      note: note.trim(),
    }

    if (activity.name === PHOTO_ACTIVITY && photoDataUrl) {
      payload.foto = photoDataUrl.split(',')[1]
      payload.fotoMimeType = 'image/jpeg'
      payload.fotoNome = `${operatorId}_${Date.now()}`
    }

    console.log('Dimensione payload (KB):', Math.round(JSON.stringify(payload).length / 1024))

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data && data.result === 'success') {
        setFeedback({ type: 'success', message: 'Salvato nel foglio' })
        setTimeout(cancelEntry, 1100)
      } else {
        setFeedback({ type: 'error', message: 'Salvataggio non riuscito. Riprova.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Errore: ' + (err && err.message ? err.message : 'connessione assente') })
    } finally {
      setSaving(false)
    }
  }

  const showPhoto = activity?.name === PHOTO_ACTIVITY
  const ActivityIcon = activity?.icon

  return (
    <div className="app">
      <header className="header">
        <span className="header-title">Rilevazione Tempi</span>
        <span className="operator-chip">{operatorId}</span>
      </header>

      <main className="main">
        {status === 'idle' && (
          <section className="activity-section">
            <p className="section-label">Scegli l&rsquo;attività</p>
            <div className="activity-list">
              {ACTIVITIES.map((a) => {
                const Icon = a.icon
                return (
                  <button key={a.name} className="activity-row" onClick={() => selectActivity(a)}>
                    <span className="activity-icon">
                      <Icon size={26} strokeWidth={2} />
                    </span>
                    <span className="activity-label">{a.name}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {(status === 'running' || status === 'paused') && ActivityIcon && (
          <div className="timer-hero">
            <div className="timer-top">
              <ActivityIcon size={22} strokeWidth={2} />
              <span className="timer-activity">{activity.name}</span>
            </div>

            <div className={`timer-display ${status === 'paused' ? 'is-paused' : ''}`}>
              {formatElapsed(displayElapsed)}
            </div>

            {status === 'paused' && <span className="pause-badge">In pausa</span>}

            <div className="timer-controls">
              {status === 'running' ? (
                <button className="control-btn control-btn--pause" onClick={pause}>
                  <Pause size={22} />
                  Pausa
                </button>
              ) : (
                <button className="control-btn control-btn--resume" onClick={resume}>
                  <Play size={22} />
                  Riprendi
                </button>
              )}
              <button className="control-btn control-btn--stop" onClick={stop}>
                <Square size={20} />
                Termina
              </button>
            </div>

            <button className="cancel-link" onClick={cancelEntry}>
              Annulla rilevazione
            </button>
          </div>
        )}

        {status === 'stopped' && activity && (
          <div className="summary">
            <div className="summary-row">
              <span>Attività</span>
              <strong>{activity.name}</strong>
            </div>
            <div className="summary-row">
              <span>Inizio</span>
              <strong>{formatClock(startWallClock)}</strong>
            </div>
            <div className="summary-row">
              <span>Fine</span>
              <strong>{formatClock(endWallClock)}</strong>
            </div>
            <div className="summary-row">
              <span>Durata attiva</span>
              <strong>{Math.round((accumulatedMs / 60000) * 100) / 100} min</strong>
            </div>

            {showPhoto && (
              <div className="photo-block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                {!photoDataUrl ? (
                  <button className="photo-btn" onClick={() => fileInputRef.current?.click()}>
                    <Camera size={20} />
                    Scatta foto
                  </button>
                ) : (
                  <div className="photo-preview">
                    <img src={photoDataUrl} alt="Foto messa a banco" />
                    <div className="photo-actions">
                      <button className="ghost-btn" onClick={() => fileInputRef.current?.click()}>
                        Rifai foto
                      </button>
                      <button className="icon-btn" onClick={() => setPhotoDataUrl(null)} aria-label="Rimuovi foto">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <textarea
              ref={noteRef}
              className="note-input"
              placeholder="Note (facoltativo)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {feedback && <div className={`feedback feedback--${feedback.type}`}>{feedback.message}</div>}

            <div className="button-row">
              <button className="ghost-btn" onClick={cancelEntry} disabled={saving}>
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

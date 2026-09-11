import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pause, Play, Square, Camera, X, Home } from 'lucide-react'
import { SCRIPT_URL, getOperatorId, formatClock, formatElapsed, resizeImage, hasAltroFollowUp, ExtraField } from './shared.jsx'

export default function TimerFlow({ sezione, sectionLabel, activities, activityFieldsMap, photoActivityName, photoHint }) {
  const navigate = useNavigate()
  const [operatorId] = useState(getOperatorId)
  const [activity, setActivity] = useState(null)
  const [status, setStatus] = useState('idle') // idle | preparing | running | paused | stopped
  const [startWallClock, setStartWallClock] = useState(null)
  const [endWallClock, setEndWallClock] = useState(null)
  const [accumulatedMs, setAccumulatedMs] = useState(0)
  const [displayElapsed, setDisplayElapsed] = useState(0)
  const [note, setNote] = useState('')
  const [extraFields, setExtraFields] = useState({})
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

  function startTimerNow() {
    const now = new Date()
    setStartWallClock(now)
    runStartRef.current = now.getTime()
    setAccumulatedMs(0)
    setDisplayElapsed(0)
    setStatus('running')
  }

  function selectActivity(act) {
    if (status !== 'idle') return
    setActivity(act)
    if (photoActivityName && act.name === photoActivityName) {
      setStatus('preparing')
    } else {
      startTimerNow()
    }
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
    setExtraFields({})
    setPhotoDataUrl(null)
    setFeedback(null)
  }

  function setField(key, value) {
    setExtraFields((prev) => ({ ...prev, [key]: value }))
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

  const activityFields = activity ? activityFieldsMap[activity.name] || [] : []

  function missingRequiredField() {
    return activityFields.find((f) => {
      if (!f.required) return false
      if (hasAltroFollowUp(f)) {
        const val = extraFields[f.key]
        if (!val) return true
        if (val === 'Altro' && !extraFields[`${f.key}AltroTesto`]?.trim()) return true
        return false
      }
      return !extraFields[f.key]
    })
  }

  async function save() {
    const missing = missingRequiredField()
    if (missing) {
      setFeedback({ type: 'error', message: `Campo obbligatorio mancante: ${missing.label}` })
      return
    }

    setSaving(true)
    setFeedback(null)

    const durata = Math.round((accumulatedMs / 60000) * 100) / 100
    const payload = {
      sezione,
      operatore: operatorId,
      attivita: activity.name,
      oraInizio: formatClock(startWallClock),
      oraFine: formatClock(endWallClock),
      durata,
      note: note.trim(),
    }

    activityFields.forEach((f) => {
      if (hasAltroFollowUp(f)) {
        const val = extraFields[f.key] || ''
        payload[f.key] = val === 'Altro' ? `Altro: ${extraFields[`${f.key}AltroTesto`] || ''}` : val
      } else {
        payload[f.key] = extraFields[f.key] || ''
      }
    })

    if (photoActivityName && activity.name === photoActivityName && photoDataUrl) {
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

  const ActivityIcon = activity?.icon
  const isPhotoActivity = photoActivityName && activity?.name === photoActivityName

  return (
    <div className="app">
      <header className="header">
        <button className="home-btn" onClick={() => navigate('/')} aria-label="Torna alla home">
          <Home size={20} />
        </button>
        <span className="header-title">Rilevazione Tempi · {sectionLabel}</span>
        <span className="operator-chip">{operatorId}</span>
      </header>

      <main className="main">
        {status === 'idle' && (
          <section className="activity-section">
            <p className="section-label">Scegli l&rsquo;attività</p>
            <div className="activity-list">
              {activities.map((a) => {
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

        {status === 'preparing' && activity && ActivityIcon && (
          <div className="summary">
            <div className="stopped-header">
              <ActivityIcon size={20} strokeWidth={2} />
              <span>{activity.name}</span>
            </div>

            <div className="photo-block">
              <p className="photo-hint">{photoHint}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              {!photoDataUrl ? (
                <>
                  <button className="photo-btn" onClick={() => fileInputRef.current?.click()}>
                    <Camera size={20} />
                    Scatta foto
                  </button>
                  <button className="ghost-btn" onClick={startTimerNow}>
                    Salta foto e avvia
                  </button>
                </>
              ) : (
                <div className="photo-preview">
                  <img src={photoDataUrl} alt="Foto attività" />
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

            {photoDataUrl && (
              <button className="cta-btn" onClick={startTimerNow}>
                Avvia rilevazione
              </button>
            )}

            <button className="cancel-link" onClick={cancelEntry}>
              Annulla rilevazione
            </button>
          </div>
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

        {status === 'stopped' && activity && ActivityIcon && (
          <div className="summary">
            <div className="stopped-header">
              <ActivityIcon size={20} strokeWidth={2} />
              <span>{activity.name}</span>
            </div>

            {activityFields.length > 0 && (
              <div className="fields-section">
                <p className="section-label">Dettagli attività</p>
                <p className="fields-intro">
                  Aiutaci fornendo informazioni utili per analizzare i dati — i campi con <span className="required-mark">*</span> sono
                  obbligatori, gli altri facoltativi.
                </p>
                {activityFields.map((field) => (
                  <div className="field-group" key={field.key}>
                    <label className="field-label">
                      {field.label}
                      {field.required && <span className="required-mark"> *</span>}
                    </label>
                    <ExtraField field={field} value={extraFields[field.key]} onChange={(v) => setField(field.key, v)} />
                    {hasAltroFollowUp(field) && extraFields[field.key] === 'Altro' && (
                      <input
                        type="text"
                        className="field-input"
                        placeholder="Specifica..."
                        value={extraFields[`${field.key}AltroTesto`] || ''}
                        onChange={(e) => setField(`${field.key}AltroTesto`, e.target.value)}
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </div>
                ))}
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

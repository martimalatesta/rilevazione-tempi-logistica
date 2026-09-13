// URL della Web App Google Apps Script (endpoint che scrive sul Google Sheet e, per Messa a banco, su Drive)
export const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwiaX7qCDsxRm2DKU-lAO3wgwhI4FE5pP2zmoDl4FOaqZDhOT0bZ7fEu4KLKDucMkDReA/exec'

export const REPARTI = [
  'Utensileria',
  'Elettricità',
  'Ferramenta',
  'Falegnameria',
  'Piastrelle',
  'Sanitari',
  'Edilizia',
  'Idraulica',
  'Vernici',
]

export const INTERRUZIONE_OPTIONS = [
  'Nessuna',
  'Circa 1 minuto',
  'Circa 5 minuti',
  'Circa 10 minuti',
  'Circa 15 minuti',
  'Circa 20 minuti',
  'Altro',
]

export function getOperatorId() {
  const key = 'rt_operator_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = 'OP-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    localStorage.setItem(key, id)
  }
  return id
}

export function formatClock(date) {
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatElapsed(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}

// Ridimensiona/comprime la foto lato client prima dell'invio, per upload veloci anche con rete debole
export function resizeImage(file, maxWidth = 1280, quality = 0.75) {
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

export function hasAltroFollowUp(field) {
  return field.type === 'interruzione' || (field.type === 'select' && field.options?.includes('Altro'))
}

export function ExtraField({ field, value, onChange }) {
  if (field.type === 'text') {
    return <input type="text" className="field-input" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  }
  if (field.type === 'number') {
    return (
      <input
        type="number"
        inputMode="numeric"
        className="field-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  if (field.type === 'select') {
    return (
      <select className="field-input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seleziona…</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }
  if (field.type === 'interruzione') {
    return (
      <select className="field-input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seleziona…</option>
        {INTERRUZIONE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }
  if (field.type === 'choice') {
    return (
      <div className="toggle-group">
        {field.options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`toggle-btn ${value === opt ? 'is-active' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }
  return null
}

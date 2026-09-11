import { PackageMinus, Combine } from 'lucide-react'
import { REPARTI } from './shared.jsx'

export const OUT_ACTIVITIES = [
  { name: 'Prelievo', icon: PackageMinus },
  { name: 'Consolidazione', icon: Combine },
]

const OUT_NUMERIC_FIELDS = [
  { key: 'numeroArticoli', label: 'Numero articoli', type: 'number', required: false },
  { key: 'numeroBancali', label: 'Numero bancali', type: 'number', required: false },
]

export const OUT_ACTIVITY_FIELDS = {
  Prelievo: [{ key: 'reparto', label: 'Reparto', type: 'select', options: REPARTI, required: false }, ...OUT_NUMERIC_FIELDS],
  Consolidazione: [...OUT_NUMERIC_FIELDS],
}

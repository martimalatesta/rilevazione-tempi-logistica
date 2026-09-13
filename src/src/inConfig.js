import { Truck, ClipboardCheck, RotateCcw, PackageCheck, Trash2 } from 'lucide-react'
import { REPARTI } from './shared.jsx'

export const IN_ACTIVITIES = [
  { name: 'Scarico', icon: Truck },
  { name: 'Spunta', icon: ClipboardCheck },
  { name: 'Riconta', icon: RotateCcw },
  { name: 'Messa a banco', icon: PackageCheck },
  { name: 'Smaltimento imballaggi', icon: Trash2 },
]

export const IN_PHOTO_ACTIVITY = 'Messa a banco'
export const IN_PHOTO_HINT = 'Allega foto dell\u2019elenco dei prodotti che stai mettendo a banco (facoltativo)'

const REPARTO_FIELD = { key: 'reparto', label: 'Reparto', type: 'select', options: REPARTI, required: false }

const ORDINE_EXTRA_FIELDS = [
  { key: 'numeroOrdine', label: 'Numero ordine', type: 'text', required: false },
  { key: 'numeroBancali', label: 'Numero bancali', type: 'number', required: false },
  { key: 'numeroArticoli', label: 'Numero articoli', type: 'number', required: false },
]

export const IN_ACTIVITY_FIELDS = {
  Scarico: [{ key: 'origine', label: 'Origine', type: 'choice', options: ['Corriere', 'Piattaforma'], required: false }],
  Spunta: [REPARTO_FIELD, ...ORDINE_EXTRA_FIELDS],
  Riconta: [REPARTO_FIELD, ...ORDINE_EXTRA_FIELDS],
  'Messa a banco': [
    REPARTO_FIELD,
    { key: 'interruzioneCliente', label: 'Interruzione cliente', type: 'interruzione', required: true },
    {
      key: 'riservaAlta',
      label: 'Hai dovuto mettere alcuni prodotti in riserva alta?',
      type: 'choice',
      options: ['Sì', 'No'],
      required: true,
    },
    {
      key: 'zonaStoccaggio',
      label: 'Hai dovuto riportare alcuni prodotti nella zona logistica di stoccaggio?',
      type: 'choice',
      options: ['Sì', 'No'],
      required: true,
    },
    ...ORDINE_EXTRA_FIELDS,
  ],
  'Smaltimento imballaggi': [],
}

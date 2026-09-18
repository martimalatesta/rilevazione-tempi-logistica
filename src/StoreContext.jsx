import { createContext, useContext, useState } from 'react'
import { Pencil, Check } from 'lucide-react'

const KEY = 'rt_store_name'
const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [storeName, setStoreNameState] = useState(() => localStorage.getItem(KEY) || '')

  function setStoreName(name) {
    localStorage.setItem(KEY, name)
    setStoreNameState(name)
  }

  return <StoreContext.Provider value={{ storeName, setStoreName }}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}

export function StoreChip() {
  const { storeName, setStoreName } = useStore()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(storeName)

  function confirm() {
    const trimmed = value.trim()
    if (trimmed) setStoreName(trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="store-edit">
        <input
          type="text"
          className="store-edit-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <button className="store-edit-confirm" onClick={confirm} aria-label="Conferma negozio">
          <Check size={16} />
        </button>
      </div>
    )
  }

  return (
    <button
      className="store-chip"
      onClick={() => {
        setValue(storeName)
        setEditing(true)
      }}
    >
      {storeName}
      <Pencil size={13} />
    </button>
  )
}

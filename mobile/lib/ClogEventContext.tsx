import { createContext, useContext, useState, ReactNode } from 'react'
import { ClogEvent } from '../types/clog-events'

type ClogEventContextType = {
  selectedEvent: ClogEvent | null
  setSelectedEvent: (event: ClogEvent | null) => void
}

const ClogEventContext = createContext<ClogEventContextType | undefined>(undefined)

export function ClogEventProvider({ children }: { children: ReactNode }) {
  const [selectedEvent, setSelectedEvent] = useState<ClogEvent | null>(null)

  return (
    <ClogEventContext.Provider value={{ selectedEvent, setSelectedEvent }}>
      {children}
    </ClogEventContext.Provider>
  )
}

export function useClogEvent() {
  const ctx = useContext(ClogEventContext)
  if (!ctx) throw new Error('useClogEvent must be used inside a ClogEventProvider')
  return ctx
}
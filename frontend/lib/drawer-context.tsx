"use client"

import { createContext, useContext, useState } from "react"

const DrawerContext = createContext<{
  drawerOpen: boolean
  setDrawerOpen: (v: boolean) => void
}>({ drawerOpen: false, setDrawerOpen: () => {} })

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <DrawerContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      {children}
    </DrawerContext.Provider>
  )
}

export const useDrawer = () => useContext(DrawerContext)
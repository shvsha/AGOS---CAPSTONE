"use client"

// icons
import { Menu } from 'lucide-react' 
import { FaBell } from 'react-icons/fa'

import Link from 'next/link'

// react
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'


// lib
import { fetchWithAuth, getUserRole } from '@/lib/auth'
import { useDrawer } from '@/lib/drawer-context' 

// map pathnames to page titles
const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "User Management",
  "/admin/users/form": "User Management",
  "/admin/barangay": "Barangay Management",
  "/admin/barangay/form": "Barangay Management",
  "/admin/monitoring": "Monitoring",
  "/admin/alerts": "Alerts",
  "/admin/node": "Node Management",
  "/admin/hotspots": "Canal Hotspots",
  "/admin/history/clog-events": "Clog Events",
  "/admin/history/waste": "Waste Classification",
  "/admin/history/barangay-reports": "Barangay Reports",
  "/admin/history/monthly-reports": "Municipal Reports",
  "/admin/health": "Sensor Nodes Health",
  "/admin/audit": "Audit Logs",
  "/menro/map": "Regional Map Monitoring",
  "/menro/alerts": "Alerts",
  "/menro/analytics": "Waste Analytics",
  "/menro/resources": "Resources",
  "/menro/barangay-reports": "Barangay Reports",
  "/menro/reports": "Monthly Reports",
  "/barangay/map": "Localized Map",
  "/barangay/alerts": "Alerts",
  "/barangay/analytics": "Waste Analytics",
  "/barangay/submit-report": "Report Submission",
}

// notification route per role
const alertRoutes: Record<string, string> = {
  Admin: "/admin/alerts",
  MENRO: "/menro/alerts",
  Barangay: "/barangay/alerts",
}

export default function Header() {
  const pathname = usePathname()
  const [alertHref, setAlertHref] = useState("#")
  const [unreadCount, setUnreadCount] = useState(0)
  const { setDrawerOpen } = useDrawer()

  useEffect(() => {
    const role = getUserRole()
    if (role) setAlertHref(alertRoutes[role] ?? "#")
  }, [])

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/unread-count/`)
        if (!res.ok) return
        const data = await res.json()
        setUnreadCount(data.unread_count)
      } catch {
      }
    }

    fetchUnread()
    // poll every 30 seconds for live updates
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const title = pageTitles[pathname] ?? "AGOS"

  return (
    <header className="bg-[linear-gradient(90deg,#132A49_0%,#1565BC_46%,#2C7B3C_100%)] px-6 h-14 flex justify-between items-center shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]">

      {/* nav drawer */}
      <div className="flex items-center gap-3">
        {/* hamburger for mobile*/}
        <button
          className="md:hidden text-white"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={22} />
        </button>

        {/* page title */}
        <h1 className='text-base font-bold text-white'>{title}</h1>
      </div>

      {/* notification bell */}
      <Link href={alertHref} className="relative inline-flex items-center">
        <FaBell size={17} color="white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

    </header>
  )
}
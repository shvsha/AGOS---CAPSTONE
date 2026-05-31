"use client"

// icons
import { FaBell } from 'react-icons/fa'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getUserRole } from '@/lib/auth'
import { useEffect, useState } from 'react'

// map pathnames to page titles
const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "User Management",
  "/admin/monitoring": "Monitoring",
  "/admin/alerts": "Alerts",
  "/admin/health": "IoT Health",
  "/admin/history": "History",
  "/admin/audit": "Audit Logs",
  "/menro/map": "Centralized Map",
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
  admin: "/admin/alerts",
  menro: "/menro/alerts",
  barangay: "/barangay/alerts",
}

export default function Header() {
  const pathname = usePathname()
  const [alertHref, setAlertHref] = useState("#")

  useEffect(() => {
    const role = getUserRole()
    if (role) setAlertHref(alertRoutes[role] ?? "#")
  }, [])

  const title = pageTitles[pathname] ?? "AGOS"

  return (
    <header className="bg-[linear-gradient(90deg,#132A49_0%,#1565BC_46%,#2C7B3C_100%)] px-6 h-14 flex justify-between items-center shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]">

      {/* page title */}
      <h1 className='text-base font-bold text-white'>
        {title}
      </h1>

      {/* notification bell */}
      <Link href={alertHref} className="relative inline-flex items-center">
        <FaBell size={17} color="white" />
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
          3
        </span>
      </Link>

    </header>
  )
}
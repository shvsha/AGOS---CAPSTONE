"use client"

// react
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

// lib
import { api } from "@/lib/api"
import { getUserRole, clearAuth, getRefreshToken, getAccessToken } from "@/lib/auth"
import { useDrawer } from "@/lib/drawer-context"
import { DIALOG_COLOR } from "@/lib/constant"

// component
import { DialogModal } from "../DialogModal"

// icons
import {
  LayoutDashboard, Users, ChartNoAxesCombined,
  Siren, Activity, History, Stamp,
  Map, Package, FileBarChart, CalendarDays,
  MapPin, FileUp, LogOut, MoreHorizontal, X,
} from "lucide-react"

// lib


// logo
import Image from "next/image"
import AgosLogo from '../../public/agos-test-logo.png'

const navItems = {
  Admin: [
    { label: "Dashboard",      href: "/admin/dashboard",    icon: <LayoutDashboard size={18} /> },
    { label: "Users",          href: "/admin/users",        icon: <Users size={18} /> },
    { label: "Barangay",          href: "/admin/barangay",     icon: <MapPin size={18} /> },
    { label: "Monitoring",     href: "/admin/monitoring",   icon: <ChartNoAxesCombined size={18} /> },
    { label: "Alerts",         href: "/admin/alerts",       icon: <Siren size={18} /> },
    { label: "IoT Health",     href: "/admin/health",       icon: <Activity size={18} /> },
    { label: "History",        href: "/admin/history",      icon: <History size={18} /> },
    { label: "Audit Logs",     href: "/admin/audit",        icon: <Stamp size={18} /> },
  ],
  MENRO: [
    { label: "Centralized Map",  href: "/menro/map",              icon: <Map size={18} /> },
    { label: "Alerts",           href: "/menro/alerts",           icon: <Siren size={18} /> },
    { label: "Waste Analytics",  href: "/menro/analytics",        icon: <ChartNoAxesCombined size={18} /> },
    { label: "Resources",        href: "/menro/resources",        icon: <Package size={18} /> },
    { label: "Barangay Reports", href: "/menro/barangay-reports", icon: <FileBarChart size={18} /> },
    { label: "Monthly Reports",  href: "/menro/reports",          icon: <CalendarDays size={18} /> },
  ],
  Barangay: [
    { label: "Localized Map",    href: "/barangay/map",           icon: <MapPin size={18} /> },
    { label: "Alerts",           href: "/barangay/alerts",        icon: <Siren size={18} /> },
    { label: "Waste Analytics",  href: "/barangay/analytics",     icon: <ChartNoAxesCombined size={18} /> },
    { label: "Report Submission",href: "/barangay/submit-report", icon: <FileUp size={18} /> },
  ],
}


export default function NavBar() {
  // us
  const [expanded, setExpanded] = useState<boolean>(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState<boolean>(false)
  const [logoutDialog, setLogoutDialog] = useState<boolean>(false)

  const pathname = usePathname()
  const router = useRouter()
  const { drawerOpen, setDrawerOpen } = useDrawer()

  useEffect(() => {
    const role = getUserRole()
    if (role) {
      setUserRole(role)
    }
  }, [])

  const items = userRole ? navItems[userRole as keyof typeof navItems] ?? [] : []

  const MAX_VISIBLE = 4
  const visibleItems = items.slice(0, MAX_VISIBLE)
  const overflowItems = items.slice(MAX_VISIBLE)
  const hasOverflow = overflowItems.length > 0
  const overflowActive = overflowItems.some((item) => pathname === item.href)

  const handleLogout = async () => {
    try {
      const token = getRefreshToken()
      if (token) {
        await api.post('/api/auth/logout/', { refresh: token }, getAccessToken() ?? undefined)
      }
    } catch (err) {
      console.log(err)
    } finally {
      clearAuth()
      router.push("/login")
    }
  }

  return (  
    <>
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`
          relative hidden md:flex flex-col h-screen bg-[#FAFCFD] transition-all duration-300 ease-in-out z-50 border-1 border-[#C6C6C8]
          ${expanded ? 'w-54' : 'w-19'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 pb-3 overflow-hidden h-18">
          <Image
            src={AgosLogo}
            alt="AGOS Logo"
            width={40}
            height={40}
            className="rounded-full flex-shrink-0 bg-[#CDE3DE]"
          />
          {expanded && (
            <div className="whitespace-nowrap overflow-hidden">
              <p className="text-[#122A48] font-bold text-[13px] leading-tight">AGOS</p>
              <p className="text-[#122A48] text-[9px] leading-tight mt-1">
                Automated Geo-Based <br /> Obstruction Sensing System
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col mt-9 flex-1">
          {items.map(({ href, label, icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-[13px] py-3 mx-3.5 my-1 text-[12px] font-medium
                  transition-all duration-200 rounded-lg overflow-hidden whitespace-nowrap
                  ${isActive
                    ? 'bg-[#58D07159] text-[#122A48]'
                    : 'text-[#122A48] hover:bg-[#eaedf2]'
                  }
                `}
              >
                <span className="flex-shrink-0 w-5 flex items-center justify-center">{icon}</span>
                {expanded && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Logout Dialog */}
        <div className="border-t p-2">
          <button
            suppressHydrationWarning
            onClick={() => setLogoutDialog(true)}
            className={`
              flex items-center w-full cursor-pointer py-3 text-[#122A48] hover:bg-[#eaedf2]
              rounded transition-all duration-200 overflow-hidden whitespace-nowrap
              ${expanded ? 'px-[13px] gap-3' : 'px-[13px]'}
            `}
          >
            <span className="flex-shrink-0 w-5 flex items-center justify-center">
              <LogOut size={20} />
            </span>
            {expanded && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>

      </aside>
      
      
      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#FAFCFD] z-50 flex flex-col
          border-r border-[#C6C6C8] shadow-xl transition-transform duration-300 ease-in-out md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 pb-3 h-18">
          <Image src={AgosLogo} alt="AGOS Logo" width={40} height={40}
            className="rounded-full flex-shrink-0 bg-[#CDE3DE]" />
          <div>
            <p className="text-[#122A48] font-bold text-[13px] leading-tight">AGOS</p>
            <p className="text-[#122A48] text-[9px] leading-tight mt-1">
              Automated Geo-Based <br /> Obstruction Sensing System
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col mt-6 flex-1">
          {items.map(({ href, label, icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 mx-3 my-0.5 text-[13px] font-medium
                  rounded-lg transition-colors
                  ${isActive ? 'bg-[#58D07159] text-[#122A48]' : 'text-[#122A48] hover:bg-[#eaedf2]'}
                `}
              >
                <span className="w-5 flex items-center justify-center">{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t p-2">
          <button
            onClick={() => { setDrawerOpen(false); setLogoutDialog(true) }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[#122A48] hover:bg-[#eaedf2] text-[13px] font-medium transition-colors"
          >
            <span className="w-5 flex items-center justify-center"><LogOut size={20} /></span>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Dialog */}
      <DialogModal
        open={logoutDialog}
        onClose={() => setLogoutDialog(false)}
        onConfirm={handleLogout}
        color={DIALOG_COLOR.lightgray}
        icon={LogOut}
        iconColor={DIALOG_COLOR.gray}
        title="Logout"
        description="Are you sure you want to log out of your account?"
        cancelLabel="Cancel"
        confirmLabel="Logout"
      />
    </>
  )
}
"use client"

// shadcn
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

// react
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

// auth
import { getUserRole, clearAuth } from "@/lib/auth"

// component
import { DialogModal } from "../DialogModal"

// constant
import { DIALOG_COLOR } from "@/lib/constant"

// icons
import {
  LayoutDashboard, Users, ChartNoAxesCombined,
  Siren, Activity, History, Stamp,
  Map, Package, FileBarChart, CalendarDays,
  MapPin, FileUp, LogOut, MoreHorizontal, X
} from "lucide-react"

// logo
import Image from "next/image"
import AgosLogo from '../../public/agos-test-logo.png'

const navItems = {
  Admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Users",href: "/admin/users",        icon: <Users size={18} /> },
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


export default function SideBar() {
  // us
  const [expanded, setExpanded] = useState<boolean>(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState<boolean>(false)
  const [logoutDialog, setLogoutDialog] = useState<boolean>(false)

  const pathname = usePathname()
  const router = useRouter()

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

  const handleLogout = () => {
    clearAuth()
    router.push("/login")
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
        </div>


      </aside>
      
      {/* mobile nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[#FAFCFD] border-t border-[#C6C6C8] z-50 h-16">
        {/* "More" backdrop */}
        {moreOpen && (
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setMoreOpen(false)} />
        )}

        {/* "More" slide-up drawer */}
        {moreOpen && (
          <div className="fixed bottom-16 left-0 right-0 z-50 bg-[#FAFCFD] border-t border-[#C6C6C8] rounded-t-2xl shadow-xl px-4 pt-3 pb-4">
            <div className="w-10 h-1 rounded-full bg-[#C6C6C8] mx-auto mb-3" />
            <div className="flex flex-col gap-1">
              {overflowItems.map(({ href, label, icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-colors
                      ${isActive ? "bg-[#58D07159] text-[#122A48]" : "text-[#122A48] hover:bg-[#eaedf2]"}`}
                  >
                    <span className="w-5 flex items-center justify-center">{icon}</span>
                    <span>{label}</span>
                  </Link>
                )
              })}
            </div>
            <div className="border-t border-[#C6C6C8] mt-3 pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[#122A48] hover:bg-[#eaedf2] text-[13px] font-medium transition-colors">
                    <span className="w-5 flex items-center justify-center"><LogOut size={20} /></span>
                    <span>Logout</span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="pt-0 px-0 bg-[#E6EEF6] pb-0 !max-w-[280px] overflow-hidden rounded-[10px] border-none">
                  <div className="py-3 bg-[#122A48] rounded-t-lg" />
                  <AlertDialogHeader className="p-4 text-center items-center -mb-4 -mt-3">
                    <AlertDialogTitle className="font-bold text-[#122A48] text-[25px] w-full text-center">Logout</AlertDialogTitle>
                    <AlertDialogDescription className="!text-[13px] text-gray-600 w-full text-center">Are you sure you want to logout?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-row justify-center items-center gap-2 border-none mb-0.5 mr-8.5 pt-2">
                    <AlertDialogCancel className="cursor-pointer px-4">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="!bg-[#122A48] cursor-pointer text-white hover:bg-[#1a1f4d] px-4" onClick={handleLogout}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* Bar */}
        <div className="flex items-center h-full px-1">
          {visibleItems.map(({ href, label, icon }) => {
            const isActive = pathname === href
            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center gap-1 py-2 h-full">
                <span className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${isActive ? "bg-[#58D07159]" : ""}`}>
                  <span className={isActive ? "text-[#122A48]" : "text-[#6B7A90]"}>{icon}</span>
                </span>
                <span className={`text-[10px] font-medium leading-none ${isActive ? "text-[#122A48]" : "text-[#6B7A90]"}`}>{label}</span>
              </Link>
            )
          })}

          {/* More button */}
          {hasOverflow && (
            <button onClick={() => setMoreOpen(p => !p)} className="flex-1 flex flex-col items-center justify-center gap-1 py-2 h-full">
              <span className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${overflowActive || moreOpen ? "bg-[#58D07159]" : ""}`}>
                <span className={overflowActive || moreOpen ? "text-[#122A48]" : "text-[#6B7A90]"}>
                  {moreOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
                </span>
              </span>
              <span className={`text-[10px] font-medium leading-none ${overflowActive || moreOpen ? "text-[#122A48]" : "text-[#6B7A90]"}`}>More</span>
            </button>
          )}

          {/* Logout directly in bar */}
          {!hasOverflow && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex-1 flex flex-col items-center justify-center gap-1 py-2 h-full">
                  <span className="flex items-center justify-center w-10 h-7 rounded-full">
                    <LogOut size={20} className="text-[#6B7A90]" />
                  </span>
                  <span className="text-[10px] font-medium leading-none text-[#6B7A90]">Logout</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="pt-0 px-0 bg-[#E6EEF6] pb-0 !max-w-[280px] overflow-hidden rounded-[10px] border-none">
                <div className="py-3 bg-[#122A48] rounded-t-lg" />
                <AlertDialogHeader className="p-4 text-center items-center -mb-4 -mt-3">
                  <AlertDialogTitle className="font-bold text-[#122A48] text-[25px] w-full text-center">Logout</AlertDialogTitle>
                  <AlertDialogDescription className="!text-[13px] text-gray-600 w-full text-center">Are you sure you want to logout?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-row justify-center items-center gap-2 border-none mb-0.5 mr-8.5 pt-2">
                  <AlertDialogCancel className="cursor-pointer px-4">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="!bg-[#122A48] cursor-pointer text-white hover:bg-[#1a1f4d] px-4" onClick={handleLogout}>Logout</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </nav>
    </>
  )
}
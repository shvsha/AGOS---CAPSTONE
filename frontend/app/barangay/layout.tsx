import SideBar from "@/components/NavBar"
import Header from "@/components/Header"
import { DrawerProvider } from "@/lib/drawer-context"

export default function MenroLayout({ children }: { children: React.ReactNode }) {
  return (
    <DrawerProvider>
      <div className="flex h-screen">
        <SideBar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-4 lg:p-3">
            {children}
          </main>
        </div>
      </div>
    </DrawerProvider>
  )
}
import SideBar from "@/components/SideBar/page"

export default function BarangayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SideBar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
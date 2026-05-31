import SideBar from "@/components/SideBar/page"
import Header from "@/components/Header/page"

export default function MenroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SideBar />
      <main className="flex-1 overflow-auto">
        <Header />
        {children}
      </main>
    </div>
  )
}
"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NotificationCenter } from "@/components/notification-center"
import { useNotifications } from "@/hooks/use-notifications"

export function AppNavigation() {
  const pathname = usePathname()
  const { notifications } = useNotifications()
  const [searchQuery, setSearchQuery] = useState("")

  // Get the current page title based on the pathname
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard"
    if (pathname.startsWith("/movies")) return "Filmes"
    if (pathname.startsWith("/series")) return "Séries"
    if (pathname.startsWith("/hds")) return "HDs"
    if (pathname.startsWith("/settings")) return "Configurações"
    return "Movie Cover Manager"
  }

  return (
    <div className="flex h-16 items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium text-blue-900">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-64 pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <NotificationCenter notifications={notifications} />
      </div>
    </div>
  )
}


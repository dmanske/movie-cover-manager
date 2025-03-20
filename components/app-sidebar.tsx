"use client"

import React, { useState } from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  Film,
  Tv,
  HardDrive,
  Settings,
  Library,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (path: string) => {
    const currentPath = pathname || '/'
    return currentPath === path || currentPath.startsWith(`${path}/`)
  }

  // Navegação simplificada e direta
  const navigateTo = (href: string) => {
    console.log(`Navegando para: ${href}`)
    // Usando redirecionamento direto para evitar problemas com routers
    window.location.href = href
  }

  const mainMenuItems = [
    {
      title: "PRINCIPAL",
      items: [
        {
          name: "Dashboard",
          href: "/",
          icon: Home,
        },
      ],
    },
    {
      title: "BIBLIOTECA",
      items: [
        {
          name: "Filmes",
          href: "/movies",
          icon: Film,
        },
        {
          name: "Séries",
          href: "/series",
          icon: Tv,
        },
        {
          name: "Shows",
          href: "/shows",
          icon: Video,
        },
        {
          name: "Coleções",
          href: "/collections",
          icon: Library,
        },
      ],
    },
    {
      title: "DISPOSITIVOS",
      items: [
        {
          name: "HDs Conectados",
          href: "/connected-hds",
          icon: HardDrive,
        },
        {
          name: "Configurações",
          href: "/settings",
          icon: Settings,
        },
      ],
    },
  ]

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-blue-200 bg-blue-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-blue-800 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            <span className="font-bold">Movie Manager</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-white hover:bg-blue-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {mainMenuItems.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && <h3 className="mb-2 px-4 text-xs font-semibold text-blue-300">{section.title}</h3>}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => navigateTo(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2 transition-colors",
                      isActive(item.href)
                        ? "bg-blue-800 text-white"
                        : "text-blue-200 hover:bg-blue-800 hover:text-white",
                      collapsed ? "justify-center" : "",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {!collapsed && <span>{item.name}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-blue-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-700" />
          {!collapsed && (
            <div>
              <p className="font-medium">Usuário</p>
              <p className="text-xs text-blue-300">Administrador</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


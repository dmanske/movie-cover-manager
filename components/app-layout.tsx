"use client"

import { useEffect } from "react"
import type { HD } from "@/lib/types"
import { isElectron, electronAPI } from "@/lib/electron-bridge"
import { AppNavigation } from "@/components/app-navigation"
import { AppSidebar } from "@/components/app-sidebar"

export function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar localStorage apenas no lado do cliente
    if (typeof window !== 'undefined') {
      // Verificar se já temos HDs no localStorage
      if (!localStorage.getItem("hds")) {
        // Inicializar com alguns HDs de exemplo
        localStorage.setItem(
          "hds",
          JSON.stringify([
            {
              id: "hd1",
              name: "Filmes HD",
              path: "D:/Filmes",
              color: "#3B82F6",
              connected: true,
              type: "external",
              capacity: 2000,
              used: 1500,
            },
            {
              id: "hd2",
              name: "Séries HD",
              path: "E:/Series",
              color: "#10B981",
              connected: true,
              type: "external",
              capacity: 4000,
              used: 3200,
            },
            {
              id: "hd3",
              name: "Backup",
              path: "F:/Backup",
              color: "#F59E0B",
              connected: false,
              type: "external",
              capacity: 8000,
              used: 6000,
            },
          ])
        );
      }
      
      // Verificar se já temos séries no localStorage
      if (!localStorage.getItem("series")) {
        // Inicializar com lista vazia
        localStorage.setItem("series", JSON.stringify([]));
      }
      
      // Verificar se já temos filmes no localStorage
      if (!localStorage.getItem("movies")) {
        // Inicializar com lista vazia
        localStorage.setItem("movies", JSON.stringify([]));
      }
      
      // Verificar se já temos a chave da API no localStorage
      if (!localStorage.getItem("imdbApiKey")) {
        // Inicializar com uma chave padrão (substituir pela sua)
        localStorage.setItem("imdbApiKey", "3e43fe8dd3d355be4c67778958173f5b");
      }
    }
    
    // Detectar HDs conectados 
    const detectConnectedDrives = async () => {
      if (isElectron && electronAPI.detectDrives) {
        try {
          const connectedDrives = await electronAPI.detectDrives();
          // Atualizar os HDs no localStorage baseado nos discos conectados
          if (typeof window !== 'undefined') {
            const savedHds = JSON.parse(localStorage.getItem("hds") || "[]");
            const updatedHds = savedHds.map((hd: HD) => {
              // Verificar se este HD está na lista de discos conectados
              const isDriveConnected = connectedDrives.some(
                (drive: { path: string }) => drive.path === hd.path
              );
              return { ...hd, connected: isDriveConnected };
            });
            localStorage.setItem("hds", JSON.stringify(updatedHds));
          }
        } catch (error) {
          console.error("Erro ao detectar discos:", error);
        }
      }
    };

    detectConnectedDrives();
    
    // Adicionar detecção periódica de drives (a cada 5 minutos)
    const intervalId = setInterval(detectConnectedDrives, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex min-h-screen bg-blue-50">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-blue-200 bg-white shadow-sm">
          <AppNavigation />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}


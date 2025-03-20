"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type { HD } from "@/lib/types"

export function useHDs() {
  const { toast } = useToast()
  const [hds, setHds] = useState<HD[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para usar dados de exemplo
  const useExampleData = useCallback(() => {
    const initialHds: HD[] = [
      {
        id: "1",
        name: "HD 1TB Western Digital",
        path: "E:/Films",
        connected: true,
        totalSpace: 1, // Em TB
        freeSpace: 0.35, // Em TB
        color: "#3B82F6",
        dateAdded: "2023-01-15",
        type: "external",
        serialNumber: "WD-12345678",
        transferSpeed: "5 Gbps",
      },
      {
        id: "2",
        name: "HD 2TB Seagate",
        path: "F:/Series",
        connected: true,
        totalSpace: 2, // Em TB
        freeSpace: 0.8, // Em TB
        color: "#10B981",
        dateAdded: "2023-02-20",
        type: "external",
        serialNumber: "ST-87654321",
        transferSpeed: "10 Gbps",
      },
      {
        id: "3",
        name: "HD 4TB Toshiba",
        path: "G:/Backups",
        connected: false,
        totalSpace: 4, // Em TB
        freeSpace: 2.5, // Em TB
        color: "#F59E0B",
        dateAdded: "2023-03-10",
        type: "external",
        serialNumber: "TB-98765432",
        transferSpeed: "5 Gbps",
      },
    ]
    setHds(initialHds)
    localStorage.setItem("hds", JSON.stringify(initialHds))
  }, [setHds])

  // Carregar HDs do Electron ou localStorage
  const loadHDs = useCallback(async () => {
    setLoading(true)
    try {
      // Verificar se estamos no Electron
      if (typeof window !== "undefined" && window.electronAPI) {
        try {
          // Usar a API do Electron para obter os drives
          const electronHDs = await window.electronAPI.getDrives()

          if (electronHDs && electronHDs.length > 0) {
            console.log("HDs detectados via Electron:", electronHDs)
            setHds(electronHDs)
            // Salvar no localStorage como backup
            localStorage.setItem("hds", JSON.stringify(electronHDs))
            toast({
              title: "HDs Detectados",
              description: `${electronHDs.length} dispositivos de armazenamento encontrados.`,
            })
          } else {
            console.log("Nenhum HD detectado via Electron, usando dados do localStorage")
            fallbackToLocalStorage()
          }
        } catch (err) {
          console.error("Erro ao obter HDs via Electron:", err)
          fallbackToLocalStorage()
        }
      } else {
        // Fallback para localStorage
        fallbackToLocalStorage()
      }
    } catch (err) {
      console.error("Erro ao carregar HDs:", err)
      setError("Falha ao carregar informações dos HDs")
      // Usar dados de exemplo em caso de erro
      useExampleData()
    } finally {
      setLoading(false)
    }
  }, [toast, useExampleData, setHds, setError])

  // Função para carregar do localStorage
  const fallbackToLocalStorage = useCallback(() => {
    const storedHDs = localStorage.getItem("hds")
    if (storedHDs) {
      try {
        const parsedHDs = JSON.parse(storedHDs)
        setHds(parsedHDs)
      } catch (e) {
        console.error("Erro ao analisar HDs do localStorage:", e)
        useExampleData()
      }
    } else {
      // Dados de exemplo
      useExampleData()
    }
  }, [setHds, useExampleData])

  // Atualizar HDs
  const refreshHDs = useCallback(async () => {
    toast({
      title: "Atualizando HDs",
      description: "Buscando informações atualizadas dos dispositivos...",
    })
    return loadHDs()
  }, [loadHDs, toast])

  // Adicionar HD
  const addHD = useCallback(
    async (newHD: Omit<HD, "id">) => {
      try {
        const hdWithId: HD = {
          ...newHD,
          id: Date.now().toString(),
        }

        const updatedHDs = [...hds, hdWithId]
        setHds(updatedHDs)
        localStorage.setItem("hds", JSON.stringify(updatedHDs))

        toast({
          title: "HD Adicionado",
          description: `${newHD.name} foi adicionado com sucesso.`,
        })

        return { success: true, hd: hdWithId }
      } catch (err) {
        console.error("Erro ao adicionar HD:", err)
        toast({
          title: "Erro",
          description: "Falha ao adicionar HD",
          variant: "destructive",
        })
        return { success: false, error: "Falha ao adicionar HD" }
      }
    },
    [hds, toast, setHds],
  )

  // Atualizar HD
  const updateHD = useCallback(
    async (updatedHD: HD) => {
      try {
        const updatedHDs = hds.map((hd) => (hd.id === updatedHD.id ? updatedHD : hd))
        setHds(updatedHDs)
        localStorage.setItem("hds", JSON.stringify(updatedHDs))

        toast({
          title: "HD Atualizado",
          description: `${updatedHD.name} foi atualizado com sucesso.`,
        })

        return { success: true }
      } catch (err) {
        console.error("Erro ao atualizar HD:", err)
        toast({
          title: "Erro",
          description: "Falha ao atualizar HD",
          variant: "destructive",
        })
        return { success: false, error: "Falha ao atualizar HD" }
      }
    },
    [hds, toast, setHds],
  )

  // Remover HD
  const removeHD = useCallback(
    async (id: string) => {
      try {
        const hdToRemove = hds.find((hd) => hd.id === id)
        if (!hdToRemove) {
          throw new Error("HD não encontrado")
        }

        const updatedHDs = hds.filter((hd) => hd.id !== id)
        setHds(updatedHDs)
        localStorage.setItem("hds", JSON.stringify(updatedHDs))

        toast({
          title: "HD Removido",
          description: `${hdToRemove.name} foi removido com sucesso.`,
          variant: "destructive",
        })

        return { success: true }
      } catch (err) {
        console.error("Erro ao remover HD:", err)
        toast({
          title: "Erro",
          description: "Falha ao remover HD",
          variant: "destructive",
        })
        return { success: false, error: "Falha ao remover HD" }
      }
    },
    [hds, toast, setHds],
  )

  // Carregar HDs na inicialização
  useEffect(() => {
    loadHDs()
  }, [loadHDs])

  return {
    hds,
    loading,
    error,
    refreshHDs,
    addHD,
    updateHD,
    removeHD,
  }
}


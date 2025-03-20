"use client"

import { useState, useEffect } from "react"
import { Plus, HardDrive, RefreshCw, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HDCard } from "@/components/hd-card"
import { AddHDDialog } from "@/components/add-hd-dialog"
import { HDStatistics } from "@/components/hd-statistics"
import { NotificationCenter } from "@/components/notification-center"
import { useNotifications } from "@/hooks/use-notifications"
import type { HD } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function HDsManager() {
  const { toast } = useToast()
  const [hds, setHds] = useState<HD[]>([])
  const [filteredHds, setFilteredHds] = useState<HD[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showDisconnected, setShowDisconnected] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedHd, setSelectedHd] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { notifications, addNotification } = useNotifications()

  // Load HDs from localStorage
  useEffect(() => {
    const storedHds = localStorage.getItem("hds")
    if (storedHds) {
      setHds(JSON.parse(storedHds))
    } else {
      // Initialize with sample data if none exists
      const initialHds: HD[] = [
        {
          id: "1",
          name: "HD 1TB Western Digital",
          path: "E:/Films",
          connected: true,
          totalSpace: 1000,
          freeSpace: 350,
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
          totalSpace: 2000,
          freeSpace: 800,
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
          totalSpace: 4000,
          freeSpace: 2500,
          color: "#F59E0B",
          dateAdded: "2023-03-10",
          type: "external",
          serialNumber: "TB-98765432",
          transferSpeed: "5 Gbps",
        },
      ]
      setHds(initialHds)
      localStorage.setItem("hds", JSON.stringify(initialHds))
    }
  }, [])

  // Apply filters whenever hds, searchQuery, or showDisconnected changes
  useEffect(() => {
    let filtered = [...hds]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (hd) =>
          hd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hd.path.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply connection status filter
    if (!showDisconnected) {
      filtered = filtered.filter((hd) => hd.connected)
    }

    setFilteredHds(filtered)
  }, [hds, searchQuery, showDisconnected])

  const handleAddHD = (newHd: HD) => {
    const updatedHds = [...hds, newHd]
    setHds(updatedHds)
    localStorage.setItem("hds", JSON.stringify(updatedHds))

    toast({
      title: "HD Adicionado",
      description: `${newHd.name} foi adicionado com sucesso.`,
    })

    addNotification({
      id: Date.now().toString(),
      title: "HD Adicionado",
      message: `${newHd.name} foi adicionado com sucesso.`,
      type: "success",
      timestamp: new Date(),
    })
  }

  const handleUpdateHD = (updatedHd: HD) => {
    const updatedHds = hds.map((hd) => (hd.id === updatedHd.id ? updatedHd : hd))
    setHds(updatedHds)
    localStorage.setItem("hds", JSON.stringify(updatedHds))

    toast({
      title: "HD Atualizado",
      description: `${updatedHd.name} foi atualizado com sucesso.`,
    })

    addNotification({
      id: Date.now().toString(),
      title: "HD Atualizado",
      message: `${updatedHd.name} foi atualizado com sucesso.`,
      type: "info",
      timestamp: new Date(),
    })
  }

  const handleRemoveHD = (id: string) => {
    const hdToRemove = hds.find((hd) => hd.id === id)
    if (!hdToRemove) return

    const updatedHds = hds.filter((hd) => hd.id !== id)
    setHds(updatedHds)
    localStorage.setItem("hds", JSON.stringify(updatedHds))

    toast({
      title: "HD Removido",
      description: `${hdToRemove.name} foi removido com sucesso.`,
      variant: "destructive",
    })
  }

  const handleToggleConnection = (id: string) => {
    const updatedHds = hds.map((hd) => {
      if (hd.id === id) {
        return { ...hd, connected: !hd.connected }
      }
      return hd
    })

    setHds(updatedHds)
    localStorage.setItem("hds", JSON.stringify(updatedHds))

    const hd = updatedHds.find((hd) => hd.id === id)

    toast({
      title: hd?.connected ? "HD Conectado" : "HD Desconectado",
      description: `${hd?.name} foi ${hd?.connected ? "conectado" : "desconectado"} com sucesso.`,
    })
  }

  const handleSelectHD = (id: string) => {
    setSelectedHd(id === selectedHd ? null : id)
  }

  const refreshHDData = () => {
    setIsRefreshing(true)

    // Simulate updating HD data
    setTimeout(() => {
      const updatedHds = hds.map((hd) => {
        if (hd.connected) {
          // Simulate changes in free space
          const newFreeSpace = Math.max(0, hd.freeSpace + Math.floor(Math.random() * 100) - 50)
          return { ...hd, freeSpace: newFreeSpace }
        }
        return hd
      })

      setHds(updatedHds)
      localStorage.setItem("hds", JSON.stringify(updatedHds))

      setIsRefreshing(false)

      toast({
        title: "Dados Atualizados",
        description: "As informações dos HDs foram atualizadas com sucesso.",
      })

      addNotification({
        id: Date.now().toString(),
        title: "Dados Atualizados",
        message: "As informações dos HDs foram atualizadas com sucesso.",
        type: "success",
        timestamp: new Date(),
      })

      // Check for low space after update
      updatedHds.forEach((hd) => {
        if (hd.connected && hd.freeSpace / hd.totalSpace < 0.1) {
          addNotification({
            id: `low-space-${hd.id}-${Date.now()}`,
            title: "Espaço em Disco Baixo",
            message: `${hd.name} está com menos de 10% de espaço livre.`,
            type: "warning",
            timestamp: new Date(),
          })
        }
      })
    }, 1500)
  }

  // Formatação de espaço
  const formatSpace = (space: number) => {
    if (space >= 1) {
      return `${space.toFixed(2)} TB`
    } else {
      return `${(space * 1024).toFixed(0)} GB`
    }
  }

  // Adicionar um método para detectar HDs automaticamente via Electron
  const detectHDsAutomatically = async () => {
    setIsRefreshing(true);
    try {
      if (typeof window !== "undefined" && window.electronAPI) {
        const detectedHDs = await window.electronAPI.getDrives();
        if (detectedHDs && detectedHDs.length > 0) {
          // Verificar quais HDs já existem para evitar duplicações
          const existingHDsMap = new Map(hds.map(hd => [hd.path, hd]));
          const newHDs = [];
          
          for (const detectedHD of detectedHDs) {
            // Se o HD já existe, atualizar apenas espaço livre e conectado
            if (existingHDsMap.has(detectedHD.path)) {
              const existingHD = existingHDsMap.get(detectedHD.path);
              const updatedHD = {
                ...existingHD,
                connected: true,
                freeSpace: detectedHD.freeSpace,
                totalSpace: detectedHD.totalSpace
              };
              
              newHDs.push(updatedHD);
              existingHDsMap.delete(detectedHD.path);
            } else {
              // Novo HD
              newHDs.push({
                ...detectedHD,
                id: Date.now() + Math.random().toString(36).substring(2, 9),
                dateAdded: new Date().toISOString().split("T")[0]
              });
            }
          }
          
          // Adicionar HDs existentes que não foram detectados, marcando-os como desconectados
          existingHDsMap.forEach(existingHD => {
            newHDs.push({
              ...existingHD,
              connected: false
            });
          });
          
          // Atualizar estado e localStorage
          setHds(newHDs);
          localStorage.setItem("hds", JSON.stringify(newHDs));
          
          toast({
            title: "HDs Atualizados",
            description: `${detectedHDs.length} dispositivos de armazenamento encontrados automaticamente.`,
          });
          
          addNotification({
            id: Date.now().toString(),
            title: "HDs Detectados",
            message: `${detectedHDs.length} dispositivos de armazenamento atualizados automaticamente.`,
            type: "success",
            timestamp: new Date(),
          });
        } else {
          toast({
            title: "Nenhum HD Detectado",
            description: "Não foi possível detectar dispositivos de armazenamento.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Detecção Indisponível",
          description: "A detecção automática de HDs só está disponível no aplicativo desktop.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro ao detectar HDs:", err);
      toast({
        title: "Erro",
        description: "Falha ao detectar HDs automaticamente.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Gerenciamento de HDs</h1>
          <p className="text-blue-700">Gerencie seus dispositivos de armazenamento</p>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter notifications={notifications} />

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar HD
            </Button>

            <Button variant="outline" onClick={refreshHDData} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar Dados
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={detectHDsAutomatically}
              disabled={isRefreshing}
            >
              <HardDrive className="mr-2 h-4 w-4" />
              Detectar HDs
            </Button>
          </div>
        </div>
      </div>

      <HDStatistics hds={hds} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <HardDrive className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
          <Input
            type="search"
            placeholder="Buscar HDs..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDisconnected(!showDisconnected)}
          className={!showDisconnected ? "bg-blue-100" : ""}
        >
          <Filter className="mr-2 h-4 w-4" />
          {showDisconnected ? "Mostrar Todos" : "Apenas Conectados"}
        </Button>
      </div>

      {filteredHds.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
          <p className="text-blue-700">Nenhum HD encontrado com os filtros atuais.</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("")
              setShowDisconnected(true)
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredHds.map((hd) => (
            <HDCard
              key={hd.id}
              hd={hd}
              isSelected={selectedHd === hd.id}
              onSelect={handleSelectHD}
              onUpdate={handleUpdateHD}
              onRemove={handleRemoveHD}
              onToggleConnection={handleToggleConnection}
            />
          ))}
        </div>
      )}

      <AddHDDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAdd={handleAddHD} />
    </div>
  )
}


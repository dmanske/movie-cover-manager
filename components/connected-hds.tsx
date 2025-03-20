"use client"

import { useState } from "react"
import { HardDrive, Database, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HDCard } from "@/components/hd-card"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications"
import { useHDs } from "@/hooks/use-hds"
import type { HD } from "@/lib/types"

export function ConnectedHDs() {
  const { toast } = useToast()
  const { addNotification } = useNotifications()
  const { hds, loading, error, refreshHDs, updateHD, removeHD } = useHDs()
  const [selectedHd, setSelectedHd] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const connectedHds = hds.filter((hd) => hd.connected)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshHDs()
      toast({
        title: "HDs Atualizados",
        description: "Informações dos HDs foram atualizadas com sucesso.",
      })
    } catch (err) {
      console.error("Erro ao atualizar HDs:", err)
      toast({
        title: "Erro",
        description: "Falha ao atualizar informações dos HDs",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleUpdateHD = (updatedHd: HD) => {
    updateHD(updatedHd)
  }

  const handleRemoveHD = (id: string) => {
    removeHD(id)
  }

  const handleToggleConnection = (id: string) => {
    const hdToToggle = hds.find((hd) => hd.id === id)
    if (hdToToggle) {
      const updatedHd = { ...hdToToggle, connected: !hdToToggle.connected }
      updateHD(updatedHd)
    }
  }

  const handleSelectHD = (id: string) => {
    setSelectedHd(id === selectedHd ? null : id)
  }

  // Calculate total space statistics
  const totalSpace = connectedHds.reduce((acc, hd) => acc + hd.totalSpace, 0)
  const totalFreeSpace = connectedHds.reduce((acc, hd) => acc + hd.freeSpace, 0)
  const totalUsedSpace = totalSpace - totalFreeSpace
  const usedPercentage = Math.round((totalUsedSpace / totalSpace) * 100) || 0

  const formatSpace = (space: number) => {
    if (space >= 1000) {
      return `${(space / 1000).toFixed(2)} TB`
    }
    return `${space.toFixed(2)} GB`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">HDs Conectados</h1>
          <p className="text-blue-700">Visualize e gerencie os dispositivos de armazenamento conectados</p>
        </div>

        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Atualizar HDs
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="mr-4 rounded-full bg-blue-100 p-2">
              <HardDrive className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-600">HDs Conectados</p>
              <p className="text-2xl font-bold text-blue-900">{connectedHds.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="mr-4 rounded-full bg-blue-100 p-2">
              <Database className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Espaço Total</p>
              <p className="text-2xl font-bold text-blue-900">{formatSpace(totalSpace)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="mr-4 rounded-full bg-blue-100 p-2">
              <Database className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Espaço Livre</p>
              <p className="text-2xl font-bold text-blue-900">{formatSpace(totalFreeSpace)}</p>
              <p className="text-xs text-blue-500">{usedPercentage}% utilizado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
          <RefreshCw className="mb-2 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-blue-700">Carregando informações dos HDs...</p>
        </div>
      ) : error ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
          <p className="text-red-600">{error}</p>
          <Button variant="link" onClick={handleRefresh}>
            Tentar novamente
          </Button>
        </div>
      ) : connectedHds.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
          <p className="text-blue-700">Nenhum HD conectado no momento.</p>
          <p className="text-sm text-blue-600">Conecte um HD para visualizá-lo aqui.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {connectedHds.map((hd) => (
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
    </div>
  )
}


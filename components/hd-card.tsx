"use client"

import { useState, useEffect } from "react"
import { Edit, Trash2, WifiOff, Wifi, FolderOpen, Info } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { EditHDDialog } from "@/components/edit-hd-dialog"
import { HDSpaceChart } from "@/components/hd-space-chart"
import { useNotifications } from "@/hooks/use-notifications"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { HD } from "@/lib/types"

interface HDCardProps {
  hd: HD
  isSelected: boolean
  onSelect: (id: string) => void
  onUpdate: (hd: HD) => void
  onRemove: (id: string) => void
  onToggleConnection: (id: string) => void
}

export function HDCard({ hd, isSelected, onSelect, onUpdate, onRemove, onToggleConnection }: HDCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const { addNotification } = useNotifications()

  const usedSpace = hd.totalSpace - hd.freeSpace
  const usedPercentage = Math.round((usedSpace / hd.totalSpace) * 100)

  // Check for low disk space
  useEffect(() => {
    if (hd.connected && hd.freeSpace / hd.totalSpace < 0.1) {
      addNotification({
        id: `low-space-${hd.id}-${Date.now()}`,
        title: "Espaço em Disco Baixo",
        message: `${hd.name} está com menos de 10% de espaço livre (${formatSpace(hd.freeSpace)} restantes).`,
        type: "warning",
        timestamp: new Date(),
      })
    }
  }, [hd, addNotification])

  const formatSpace = (space: number) => {
    if (space >= 1) {
      return `${space.toFixed(2)} TB`
    } else {
      return `${(space * 1024).toFixed(0)} GB`
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleToggleConnection = () => {
    onToggleConnection(hd.id)

    // Add notification
    addNotification({
      id: `connection-${hd.id}-${Date.now()}`,
      title: hd.connected ? "HD Desconectado" : "HD Conectado",
      message: `${hd.name} foi ${hd.connected ? "desconectado" : "conectado"} com sucesso.`,
      type: hd.connected ? "warning" : "success",
      timestamp: new Date(),
    })
  }

  return (
    <>
      <Card
        className={`transition-all duration-300 ${
          isSelected ? "ring-2 ring-blue-500" : ""
        } ${hd.connected ? "" : "opacity-75"}`}
        onClick={() => onSelect(hd.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: hd.color }} />
              <h3 className="font-medium text-blue-900">{hd.name}</h3>
            </div>

            <Badge variant={hd.connected ? "default" : "destructive"}>
              {hd.connected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>

          <div className="mt-4 flex items-center text-sm text-blue-700">
            <FolderOpen className="mr-1 h-4 w-4" />
            <span className="font-mono">{hd.path}</span>
          </div>

          <div className="mt-4">
            <HDSpaceChart usedSpace={usedSpace} freeSpace={hd.freeSpace} color={hd.color} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-blue-600">Espaço Total</p>
              <p className="font-medium">{formatSpace(hd.totalSpace)}</p>
            </div>

            <div>
              <p className="text-blue-600">Espaço Livre</p>
              <p className="font-medium">{formatSpace(hd.freeSpace)}</p>
            </div>

            <div>
              <p className="text-blue-600">Espaço Usado</p>
              <p className="font-medium">{formatSpace(usedSpace)}</p>
            </div>

            <div>
              <p className="text-blue-600">Percentual Usado</p>
              <p className={`font-medium ${usedPercentage > 90 ? "text-red-600" : ""}`}>{usedPercentage}%</p>
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 space-y-2 rounded-md bg-blue-50 p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-blue-600">Tipo</p>
                  <p className="font-medium capitalize">{hd.type}</p>
                </div>

                <div>
                  <p className="text-blue-600">Data de Adição</p>
                  <p className="font-medium">{formatDate(hd.dateAdded)}</p>
                </div>

                {hd.serialNumber && (
                  <div>
                    <p className="text-blue-600">Número de Série</p>
                    <p className="font-medium font-mono">{hd.serialNumber}</p>
                  </div>
                )}

                {hd.transferSpeed && (
                  <div>
                    <p className="text-blue-600">Velocidade</p>
                    <p className="font-medium">{hd.transferSpeed}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t p-4">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDetails(!showDetails)
                    }}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Detalhes do HD</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center space-x-2">
              <Switch
                id={`connection-${hd.id}`}
                checked={hd.connected}
                onCheckedChange={() => handleToggleConnection()}
                onClick={(e) => e.stopPropagation()}
              />
              <Label htmlFor={`connection-${hd.id}`} className="text-xs">
                {hd.connected ? (
                  <Wifi className="h-3 w-3 text-green-600" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-600" />
                )}
              </Label>
            </div>
          </div>

          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar HD</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remover HD</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </Card>

      <EditHDDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} hd={hd} onUpdate={onUpdate} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover HD</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o HD "{hd.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                onRemove(hd.id)
                addNotification({
                  id: `remove-${hd.id}-${Date.now()}`,
                  title: "HD Removido",
                  message: `${hd.name} foi removido com sucesso.`,
                  type: "info",
                  timestamp: new Date(),
                })
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


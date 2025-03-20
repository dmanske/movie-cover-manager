"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Save, X, FolderOpen, Loader2, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { HD } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface AddHDDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (hd: HD) => void
}

export function AddHDDialog({ open, onOpenChange, onAdd }: AddHDDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    totalSpace: "",
    freeSpace: "",
    color: "#3B82F6",
    type: "external",
    serialNumber: "",
    transferSpeed: "",
  })
  const [detectedDrives, setDetectedDrives] = useState<HD[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [isElectronAvailable, setIsElectronAvailable] = useState(false)

  // Verificar se o Electron está disponível quando o diálogo é aberto
  useEffect(() => {
    if (open) {
      setIsElectronAvailable(typeof window !== "undefined" && !!window.electronAPI)
    }
  }, [open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Garantir que número decimal use ponto ao invés de vírgula
    if (name === "totalSpace" || name === "freeSpace") {
      // Substituir vírgula por ponto
      const formattedValue = value.replace(",", ".")
      setFormData({ ...formData, [name]: formattedValue })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const selectDrive = (drive: HD) => {
    setFormData({
      name: drive.name,
      path: drive.path,
      totalSpace: drive.totalSpace.toString(),
      freeSpace: drive.freeSpace.toString(),
      color: drive.color,
      type: drive.type,
      serialNumber: drive.serialNumber || "",
      transferSpeed: drive.transferSpeed || "",
    })
    
    toast({
      title: "Drive Selecionado",
      description: `${drive.name} foi selecionado automaticamente.`,
    })
  }

  const detectDrives = async () => {
    if (!isElectronAvailable) {
      toast({
        title: "Detecção Indisponível",
        description: "A detecção automática de HDs só está disponível no aplicativo desktop.",
        variant: "destructive",
      })
      return
    }

    setIsDetecting(true)
    try {
      const drives = await window.electronAPI.getDrives()
      if (drives && drives.length > 0) {
        setDetectedDrives(drives)
        toast({
          title: "HDs Detectados",
          description: `${drives.length} dispositivos encontrados.`,
        })
      } else {
        toast({
          title: "Nenhum HD Detectado",
          description: "Não foi possível detectar dispositivos de armazenamento.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao detectar drives:", error)
      toast({
        title: "Erro",
        description: "Falha ao detectar HDs. Por favor, insira manualmente.",
        variant: "destructive",
      })
    } finally {
      setIsDetecting(false)
    }
  }

  const selectDirectory = async () => {
    if (!isElectronAvailable) {
      toast({
        title: "Seleção Indisponível",
        description: "A seleção de diretório só está disponível no aplicativo desktop.",
        variant: "destructive",
      })
      return
    }

    try {
      const selectedDir = await window.electronAPI.selectDirectory()
      if (selectedDir) {
        setFormData({ ...formData, path: selectedDir })
        toast({
          title: "Diretório Selecionado",
          description: `Selecionado: ${selectedDir}`,
        })
      }
    } catch (error) {
      console.error("Erro ao selecionar diretório:", error)
      toast({
        title: "Erro",
        description: "Falha ao selecionar diretório. Por favor, insira manualmente.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = () => {
    // Validar form
    if (!formData.name || !formData.path || !formData.totalSpace || !formData.freeSpace) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const totalSpace = Number.parseFloat(formData.totalSpace)
    const freeSpace = Number.parseFloat(formData.freeSpace)

    if (isNaN(totalSpace) || isNaN(freeSpace)) {
      toast({
        title: "Valores Inválidos",
        description: "Os valores de espaço devem ser números válidos.",
        variant: "destructive",
      })
      return
    }

    if (freeSpace > totalSpace) {
      toast({
        title: "Erro de Validação",
        description: "O espaço livre não pode ser maior que o espaço total.",
        variant: "destructive",
      })
      return
    }

    // Criar novo HD
    const newHD: HD = {
      id: Date.now().toString(),
      name: formData.name,
      path: formData.path,
      connected: true,
      totalSpace: totalSpace,
      freeSpace: freeSpace,
      color: formData.color,
      dateAdded: new Date().toISOString().split("T")[0],
      type: formData.type,
      serialNumber: formData.serialNumber || undefined,
      transferSpeed: formData.transferSpeed || undefined,
    }

    // Adicionar HD
    onAdd(newHD)

    // Resetar form e fechar diálogo
    setFormData({
      name: "",
      path: "",
      totalSpace: "",
      freeSpace: "",
      color: "#3B82F6",
      type: "external",
      serialNumber: "",
      transferSpeed: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo HD</DialogTitle>
          <DialogDescription>Adicione um novo dispositivo de armazenamento ao sistema.</DialogDescription>
        </DialogHeader>

        {isElectronAvailable && (
          <div className="mb-4">
            <Button 
              variant="secondary" 
              className="w-full" 
              onClick={detectDrives}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <HardDrive className="mr-2 h-4 w-4" />
              )}
              {isDetecting ? "Detectando HDs..." : "Detectar HDs Automaticamente"}
            </Button>
            
            {detectedDrives.length > 0 && (
              <div className="mt-2">
                <Label>HDs Detectados</Label>
                <Select onValueChange={(value) => {
                  const drive = detectedDrives.find(d => d.id === value)
                  if (drive) selectDrive(drive)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um HD..." />
                  </SelectTrigger>
                  <SelectContent>
                    {detectedDrives.map((drive) => (
                      <SelectItem key={drive.id} value={drive.id}>
                        {drive.name} ({drive.totalSpace.toFixed(2)} TB)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do HD *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="HD 1TB Western Digital"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="path">Caminho do Diretório *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="path"
                name="path"
                value={formData.path}
                onChange={handleInputChange}
                placeholder="E:/Films"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={selectDirectory}
                disabled={!isElectronAvailable}
                title={isElectronAvailable ? "Selecionar Diretório" : "Indisponível no navegador"}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            {!isElectronAvailable && (
              <p className="text-xs text-amber-600">
                A seleção de diretório só está disponível no aplicativo desktop.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="totalSpace">Espaço Total (TB) *</Label>
              <Input
                id="totalSpace"
                name="totalSpace"
                type="text"
                value={formData.totalSpace}
                onChange={handleInputChange}
                placeholder="1.0"
                step="0.1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="freeSpace">Espaço Livre (TB) *</Label>
              <Input
                id="freeSpace"
                name="freeSpace"
                type="text"
                value={formData.freeSpace}
                onChange={handleInputChange}
                placeholder="0.5"
                step="0.1"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="color">Cor de Identificação</Label>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: formData.color }} />
              <Input
                id="color"
                name="color"
                type="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de HD</Label>
            <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Interno</SelectItem>
                <SelectItem value="external">Externo</SelectItem>
                <SelectItem value="ssd">SSD</SelectItem>
                <SelectItem value="network">Rede</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="serialNumber">Número de Série (opcional)</Label>
            <Input
              id="serialNumber"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              placeholder="WD-12345678"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transferSpeed">Velocidade de Transferência (opcional)</Label>
            <Input
              id="transferSpeed"
              name="transferSpeed"
              value={formData.transferSpeed}
              onChange={handleInputChange}
              placeholder="5 Gbps"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="mr-2 h-4 w-4" />
            Adicionar HD
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


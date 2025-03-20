"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Save, X, FolderOpen } from "lucide-react"
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

interface EditHDDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hd: HD
  onUpdate: (hd: HD) => void
}

export function EditHDDialog({ open, onOpenChange, hd, onUpdate }: EditHDDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    totalSpace: "",
    freeSpace: "",
    color: "",
    type: "",
    serialNumber: "",
    transferSpeed: "",
  })
  const [isElectronAvailable, setIsElectronAvailable] = useState(false)

  // Verificar se o Electron está disponível quando o diálogo é aberto
  useEffect(() => {
    if (open) {
      setIsElectronAvailable(typeof window !== "undefined" && !!window.electronAPI)
    }
  }, [open])

  // Inicializar dados do formulário quando o HD muda
  useEffect(() => {
    setFormData({
      name: hd.name,
      path: hd.path,
      totalSpace: hd.totalSpace.toString(),
      freeSpace: hd.freeSpace.toString(),
      color: hd.color,
      type: hd.type,
      serialNumber: hd.serialNumber || "",
      transferSpeed: hd.transferSpeed || "",
    })
  }, [hd])

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
    // Validar formulário
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

    // Atualizar HD
    const updatedHD: HD = {
      ...hd,
      name: formData.name,
      path: formData.path,
      totalSpace: totalSpace,
      freeSpace: freeSpace,
      color: formData.color,
      type: formData.type,
      serialNumber: formData.serialNumber || undefined,
      transferSpeed: formData.transferSpeed || undefined,
    }

    // Atualizar HD
    onUpdate(updatedHD)

    // Fechar diálogo
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar HD</DialogTitle>
          <DialogDescription>Atualize as informações do dispositivo de armazenamento.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Nome do HD *</Label>
            <Input
              id="edit-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="HD 1TB Western Digital"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-path">Caminho do Diretório *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-path"
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
              <Label htmlFor="edit-totalSpace">Espaço Total (TB) *</Label>
              <Input
                id="edit-totalSpace"
                name="totalSpace"
                type="text"
                value={formData.totalSpace}
                onChange={handleInputChange}
                placeholder="1.0"
                step="0.1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-freeSpace">Espaço Livre (TB) *</Label>
              <Input
                id="edit-freeSpace"
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
            <Label htmlFor="edit-color">Cor de Identificação</Label>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: formData.color }} />
              <Input
                id="edit-color"
                name="color"
                type="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-type">Tipo de HD</Label>
            <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
              <SelectTrigger id="edit-type">
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
            <Label htmlFor="edit-serialNumber">Número de Série (opcional)</Label>
            <Input
              id="edit-serialNumber"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              placeholder="WD-12345678"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-transferSpeed">Velocidade de Transferência (opcional)</Label>
            <Input
              id="edit-transferSpeed"
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
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


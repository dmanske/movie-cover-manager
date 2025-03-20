"use client"

import { useState, useEffect, useCallback } from "react"
import { FolderOpen, File, HardDrive, RefreshCw, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { electronAPI, isElectron } from "@/lib/electron-bridge"
import { ChevronRight, FolderIcon, FileIcon, ArrowUpCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { HD } from "@/lib/types"

interface FileBrowserProps {
  hdId: string
  onFileSelect: (path: string) => void
  showFolders?: boolean
  showFiles?: boolean
  initialPath?: string
  height?: string
  showLoadingIndicator?: boolean
}

interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: Date
}

export function FileBrowser({
  hdId,
  onFileSelect,
  showFolders = true,
  showFiles = true,
  initialPath,
  height = "250px",
  showLoadingIndicator = true,
}: FileBrowserProps) {
  const { toast } = useToast()
  const [hdPath, setHdPath] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string>("")
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [hdRootPath, setHdRootPath] = useState<string>("")

  // Carregar o caminho do HD
  useEffect(() => {
    const storedHds = localStorage.getItem("hds")
    if (storedHds) {
      try {
        const hds = JSON.parse(storedHds)
        const hd = hds.find((h: any) => h.id === hdId)
        if (hd) {
          console.log(`HD encontrado: ${hd.name}, caminho: ${hd.path}`)
          setHdPath(hd.path)
          setCurrentPath(hd.path)
          setHdRootPath(hd.path)
        } else {
          console.error(`HD com ID ${hdId} não encontrado`)
          setError(`HD com ID ${hdId} não encontrado`)
        }
      } catch (e) {
        console.error("Erro ao analisar HDs do localStorage:", e)
        setError("Erro ao carregar informações do HD")
      }
    } else {
      console.error("Nenhum HD encontrado no localStorage")
      setError("Nenhum HD encontrado")
    }
  }, [hdId])

  // Carregar arquivos e pastas do diretório atual
  const loadDirectory = useCallback(async (dirPath: string) => {
    console.log(`Carregando diretório: ${dirPath}`)
    setLoading(true)
    setError(null)

    try {
      console.log(`Usando ${isElectron ? 'API do Electron' : 'simulação de navegador'} para explorar diretório`)
      
      // Usar a ponte Electron (real ou simulação)
      const items = await electronAPI.exploreDirectory(dirPath)
      console.log(`Encontrados ${items?.length || 0} itens no diretório`)

      if (Array.isArray(items)) {
        // Separar arquivos e pastas
        const dirFolders = items.filter((item: FileItem) => item.isDirectory)
        const dirFiles = items.filter((item: FileItem) => !item.isDirectory)

        setFolders(dirFolders)
        setFiles(dirFiles)
      } else {
        console.error("Resultado não é um array:", items)
        throw new Error("Formato de resposta inválido")
      }
    } catch (error) {
      console.error("Erro ao explorar diretório:", error)
      setError(`Erro ao carregar diretório: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o diretório",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Carregar diretório quando o caminho mudar
  useEffect(() => {
    if (currentPath) {
      loadDirectory(currentPath)
    }
  }, [currentPath, loadDirectory])

  // Navegar para uma pasta
  const handleFolderClick = (folder: FileItem) => {
    setCurrentPath(folder.path)
    // Não usamos onFileSelect aqui porque estamos navegando, não selecionando
  }

  // Selecionar um diretório atual
  const handleSelectCurrentDirectory = () => {
    if (currentPath) {
      onFileSelect(currentPath)
      toast({
        title: "Diretório selecionado",
        description: `Diretório selecionado: ${currentPath}`,
      })
    }
  }

  // Navegar para o diretório pai
  const navigateUp = () => {
    if (currentPath && currentPath !== hdPath) {
      // Determinar o separador de caminho com base no sistema operacional
      const separator = currentPath.includes("\\") ? "\\" : "/"

      // Encontrar a última ocorrência do separador
      const lastSeparatorIndex = currentPath.lastIndexOf(separator)

      if (lastSeparatorIndex > 0) {
        // Obter o diretório pai
        const parentPath = currentPath.substring(0, lastSeparatorIndex)
        setCurrentPath(parentPath || hdPath)
      } else {
        // Se não houver separador ou estiver no início, voltar para o caminho do HD
        setCurrentPath(hdPath)
      }
    }
  }

  // Selecionar um arquivo
  const handleFileClick = (file: FileItem) => {
    onFileSelect(file.path)
    toast({
      title: "Arquivo selecionado",
      description: `Arquivo selecionado: ${file.name}`,
    })
  }

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Abrir diálogo nativo de seleção de diretório (quando no Electron)
  const openDirectoryDialog = async () => {
    try {
      const selectedDir = await electronAPI.selectDirectory()
      if (selectedDir) {
        setCurrentPath(selectedDir)
        toast({
          title: "Diretório selecionado",
          description: `Diretório alterado para: ${selectedDir}`,
        })
      }
    } catch (err) {
      console.error("Erro ao selecionar diretório:", err)
      toast({
        title: "Erro",
        description: "Não foi possível selecionar o diretório",
        variant: "destructive",
      })
    }
  };

  if (!hdPath) {
    return (
      <div className="p-4 text-center text-blue-600 bg-blue-50 rounded-md">
        {error || "HD não encontrado. Verifique se o HD está conectado e tente novamente."}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-blue-600">
        <div className="flex items-center overflow-hidden">
          <HardDrive className="mr-1 inline-block h-4 w-4 flex-shrink-0" />
          <span className="font-mono truncate max-w-[180px]">{currentPath}</span>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={navigateUp} disabled={currentPath === hdPath || loading}>
            <ArrowUp className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => currentPath && loadDirectory(currentPath)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Separator />

      <ScrollArea className="h-[200px] rounded-md border">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-red-500 p-4 text-center">{error}</div>
        ) : (
          <div className="p-2">
            {showFolders && (
              <div>
                <div className="mb-1 text-xs font-medium text-blue-800">
                  Pastas: ({folders.length > 0 ? folders.length : "Nenhuma"})
                </div>
                {folders.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1 mb-3">
                    {folders.map((folder, index) => (
                      <Button
                        key={`${folder.path}-${index}`}
                        variant="outline"
                        size="sm"
                        className="justify-start gap-1.5 h-auto py-1 px-2"
                        onClick={() => handleFolderClick(folder)}
                      >
                        <FolderOpen className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{folder.name}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-blue-500 text-sm mb-3 italic">
                    Pasta vazia. Navegue para outro diretório.
                  </div>
                )}
                
                {/* Botão para selecionar o diretório atual */}
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full mb-3"
                  onClick={handleSelectCurrentDirectory}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Selecionar Diretório Atual
                </Button>
              </div>
            )}

            {showFiles && files.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-blue-800">Arquivos: ({files.length})</div>
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div
                      key={`${file.path}-${index}`}
                      className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-blue-50 cursor-pointer"
                      onClick={() => handleFileClick(file)}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <File className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                        <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                      </div>
                      <span className="text-xs text-blue-400">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!folders.length && !files.length && (
              <div className="flex flex-col items-center justify-center h-[150px] text-blue-500">
                <p className="text-sm mb-2">Nenhum item encontrado neste diretório.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={navigateUp}
                  disabled={currentPath === hdPath}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Voltar ao Diretório Superior
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {isElectron && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={openDirectoryDialog}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Escolher Outro Diretório
          </Button>
        </div>
      )}
    </div>
  )
}


"use client"

import { useState } from "react"
import { FolderOpen, Search, Film, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications"

interface MediaFile {
  name: string
  path: string
  size: number
  modified: Date
}

export function MediaScanner() {
  const { toast } = useToast()
  const { addNotification } = useNotifications()
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null)
  const [scanComplete, setScanComplete] = useState(false)

  // Selecionar diretório para escanear
  const selectDirectory = async () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      const selectedDir = await window.electronAPI.selectDirectory()
      if (selectedDir) {
        setSelectedDirectory(selectedDir)
        setScanComplete(false)
        setMediaFiles([])
      }
    } else {
      toast({
        title: "Não suportado",
        description: "A seleção de diretório só está disponível no aplicativo desktop",
      })
    }
  }

  // Escanear diretório por arquivos de mídia
  const scanDirectory = async () => {
    if (!selectedDirectory) {
      toast({
        title: "Erro",
        description: "Selecione um diretório primeiro",
        variant: "destructive",
      })
      return
    }

    setScanning(true)
    setProgress(0)
    setScanComplete(false)

    try {
      if (typeof window !== "undefined" && window.electronAPI) {
        // Simular progresso
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const newProgress = prev + Math.random() * 10
            return newProgress > 100 ? 100 : newProgress
          })
        }, 300)

        // Escanear mídia usando a API do Electron
        const files = await window.electronAPI.scanMedia(selectedDirectory)

        // Limpar intervalo de progresso
        clearInterval(progressInterval)
        setProgress(100)

        // Atualizar estado com arquivos encontrados
        setMediaFiles(files)
        setScanComplete(true)

        // Notificar usuário
        addNotification({
          id: Date.now().toString(),
          title: "Escaneamento Concluído",
          message: `Encontrados ${files.length} arquivos de mídia em ${selectedDirectory}`,
          type: "success",
          timestamp: new Date(),
        })
      } else {
        // Fallback para web - simular escaneamento
        let progress = 0
        const progressInterval = setInterval(() => {
          progress += 5
          setProgress(progress > 100 ? 100 : progress)

          if (progress >= 100) {
            clearInterval(progressInterval)

            // Gerar dados simulados
            const fakeFiles = Array.from({ length: 15 }, (_, i) => ({
              name: `movie${i + 1}.mp4`,
              path: `${selectedDirectory}/movie${i + 1}.mp4`,
              size: Math.floor(Math.random() * 2000000000),
              modified: new Date(),
            }))

            setMediaFiles(fakeFiles)
            setScanComplete(true)

            addNotification({
              id: Date.now().toString(),
              title: "Escaneamento Concluído (Simulado)",
              message: `Encontrados ${fakeFiles.length} arquivos de mídia simulados`,
              type: "success",
              timestamp: new Date(),
            })
          }
        }, 200)
      }
    } catch (error) {
      console.error("Erro ao escanear diretório:", error)
      toast({
        title: "Erro",
        description: "Falha ao escanear o diretório",
        variant: "destructive",
      })
    } finally {
      setScanning(false)
    }
  }

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escaneador de Mídia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button onClick={selectDirectory} disabled={scanning}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Selecionar Diretório
          </Button>

          {selectedDirectory && (
            <Button onClick={scanDirectory} disabled={scanning || !selectedDirectory}>
              {scanning ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {scanning ? "Escaneando..." : "Iniciar Escaneamento"}
            </Button>
          )}

          {selectedDirectory && (
            <div className="text-sm text-blue-600">
              Diretório: <span className="font-mono">{selectedDirectory}</span>
            </div>
          )}
        </div>

        {(scanning || progress > 0) && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-right text-blue-600">{Math.round(progress)}%</div>
          </div>
        )}

        {scanComplete && (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todos ({mediaFiles.length})</TabsTrigger>
              <TabsTrigger value="movies">Filmes</TabsTrigger>
              <TabsTrigger value="series">Séries</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="rounded-md border">
                <div className="max-h-[300px] overflow-auto">
                  {mediaFiles.length > 0 ? (
                    <table className="w-full">
                      <thead className="bg-blue-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-blue-900">Nome</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-blue-900">Tamanho</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-blue-900">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {mediaFiles.map((file, index) => (
                          <tr key={index} className="hover:bg-blue-50">
                            <td className="px-4 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Film className="h-4 w-4 text-blue-500" />
                                <span className="truncate max-w-[300px]">{file.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm">{formatFileSize(file.size)}</td>
                            <td className="px-4 py-2 text-sm">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Film className="mr-1 h-3 w-3" />
                                  Importar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-blue-500">
                      Nenhum arquivo encontrado
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="movies" className="mt-4">
              <div className="flex h-[200px] items-center justify-center text-blue-500">
                Classificação automática em desenvolvimento
              </div>
            </TabsContent>

            <TabsContent value="series" className="mt-4">
              <div className="flex h-[200px] items-center justify-center text-blue-500">
                Classificação automática em desenvolvimento
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}


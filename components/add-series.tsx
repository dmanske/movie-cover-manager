"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Save, X, Search, RefreshCw, Tv } from "lucide-react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { HD, Series } from "@/lib/types"
import { FileBrowser } from "@/components/file-browser"
import { ImageManager } from "@/components/utils/image-manager"

export function AddSeries({ onSeriesAdded }: { onSeriesAdded?: (series: Series) => void }) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [hds, setHds] = useState<HD[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    imdbId: "",
    hdId: "",
    poster: "",
    hdPath: "",
    year: "",
  })

  // Estado para controlar se está baixando as imagens
  const [isDownloadingImages, setIsDownloadingImages] = useState(false)

  // Load HDs from localStorage
  useEffect(() => {
    const storedHds = localStorage.getItem("hds")
    if (storedHds) {
      setHds(JSON.parse(storedHds))
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleHdChange = (value: string) => {
    setFormData({ ...formData, hdId: value })
    
    // Limpar o diretório selecionado ao trocar de HD
    setSelectedDirectory(null)
  }
  
  const handleDirectorySelected = (path: string) => {
    setSelectedDirectory(path)
    setFormData({ ...formData, hdPath: path })
  }

  const searchTMDb = async () => {
    if (!searchQuery) {
      toast({
        title: "Erro",
        description: "Por favor, digite um termo de busca",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setSearchResults([])

    try {
      const apiKey = localStorage.getItem("imdbApiKey")
      if (!apiKey) {
        toast({
          title: "Chave de API Ausente",
          description: "Por favor, adicione sua chave de API do TMDb nas configurações primeiro.",
          variant: "destructive",
        })
        setIsSearching(false)
        return
      }

      const response = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}`,
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results)
      } else {
        toast({
          title: "Nenhum Resultado",
          description: "Nenhuma série encontrada com esse termo de busca.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Falha na busca: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const selectShow = (show: any) => {
    // Extrair o ano da data de lançamento
    const year = show.first_air_date ? 
      show.first_air_date.substring(0, 4) : 
      "";
    
    setFormData({
      title: show.name,
      imdbId: `tmdb-${show.id}`, // Using TMDb ID with prefix
      hdId: formData.hdId,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : "",
      hdPath: formData.hdPath,
      year: year,
    })
    setSearchResults([])
    setSearchQuery("")
  }

  const saveSeries = async () => {
    if (!formData.title || !formData.hdId) {
      toast({
        title: "Erro",
        description: "Título e HD são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Gerar um ID único para a série
    const seriesId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    // Baixar as imagens se estiverem disponíveis
    setIsDownloadingImages(true)
    
    let posterLocalPath = formData.poster
    let posterIsLocal = false
    
    // Se tiver uma URL de poster, tentar baixá-la
    if (formData.poster && formData.poster.startsWith('http')) {
      try {
        const localPath = await ImageManager.downloadPoster(formData.poster, seriesId)
        if (localPath) {
          posterLocalPath = localPath
          posterIsLocal = true
        }
      } catch (error) {
        console.error("Erro ao baixar imagem de poster:", error)
        // Mantém a URL original em caso de erro
      }
    }
    
    setIsDownloadingImages(false)

    // Get existing series
    const storedSeries = localStorage.getItem("series")
    const allSeries = storedSeries ? JSON.parse(storedSeries) : []

    // Create new series
    const newSeries: Series = {
      id: seriesId,
      title: formData.title,
      hdId: formData.hdId,
      hdPath: formData.hdPath || undefined,
      hidden: false,
      imdbId: formData.imdbId || `unknown-${Date.now()}`,
      poster: posterLocalPath || "/placeholder.svg?height=450&width=300",
      posterUrl: formData.poster || undefined,
      posterLocal: posterIsLocal,
      watched: false,
      year: formData.year || undefined,
      seasons: [
        {
          number: 1,
          totalEpisodes: 1,
          availableEpisodes: 0,
          episodes: [],
        },
      ],
    }

    // Add to localStorage
    allSeries.push(newSeries)
    localStorage.setItem("series", JSON.stringify(allSeries))

    // Reset form and close dialog
    setFormData({
      title: "",
      imdbId: "",
      hdId: "",
      poster: "",
      hdPath: "",
      year: "",
    })
    setDialogOpen(false)

    // Notificar o componente pai que uma série foi adicionada
    if (onSeriesAdded) {
      onSeriesAdded(newSeries);
    }

    toast({
      title: "Série Adicionada",
      description: `${formData.title} foi adicionada com sucesso.`,
      variant: "success",
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Série
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Série</DialogTitle>
            <DialogDescription>Adicione uma nova série à sua coleção</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Buscar no TMDb</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por uma série..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      searchTMDb();
                    }
                  }}
                />
                <Button onClick={searchTMDb} disabled={isSearching}>
                  {isSearching ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Buscar
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-auto rounded border p-2">
                <div className="text-sm font-medium mb-2">Resultados da Busca:</div>
                <div className="space-y-2">
                  {searchResults.map((show) => (
                    <div
                      key={show.id}
                      className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer"
                      onClick={() => selectShow(show)}
                    >
                      {show.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                          alt={show.name}
                          className="h-16 w-10 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-10 bg-blue-100 flex items-center justify-center rounded">
                          <Tv className="h-6 w-6 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{show.name}</div>
                        <div className="text-xs text-gray-500">
                          {show.first_air_date ? new Date(show.first_air_date).getFullYear() : "Ano desconhecido"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Breaking Bad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imdbId">IMDb ID (opcional)</Label>
              <Input
                id="imdbId"
                name="imdbId"
                value={formData.imdbId}
                onChange={handleInputChange}
                placeholder="tt0903747"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                placeholder="2008"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hd-select">HD</Label>
              <Select value={formData.hdId} onValueChange={handleHdChange}>
                <SelectTrigger id="hd-select">
                  <SelectValue placeholder="Selecione um HD" />
                </SelectTrigger>
                <SelectContent>
                  {hds.filter(hd => hd.connected).map((hd) => (
                    <SelectItem key={hd.id} value={hd.id}>
                      {hd.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {formData.hdId && (
              <div className="space-y-2">
                <Label>Diretório (opcional)</Label>
                <div className="h-[150px] overflow-hidden rounded border">
                  <FileBrowser 
                    hdId={formData.hdId}
                    onFileSelect={handleDirectorySelected}
                    showFiles={false}
                  />
                </div>
                {selectedDirectory && (
                  <div className="text-xs text-blue-600">
                    Diretório selecionado: {selectedDirectory}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="poster">URL da Capa (opcional)</Label>
              <Input
                id="poster"
                name="poster"
                value={formData.poster}
                onChange={handleInputChange}
                placeholder="https://exemplo.com/imagem.jpg"
              />

              {formData.poster && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={formData.poster}
                    alt="Prévia da Capa"
                    className="max-h-24 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=450&width=300"
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveSeries} disabled={isDownloadingImages}>
              {isDownloadingImages ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Baixando Imagens...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Série
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


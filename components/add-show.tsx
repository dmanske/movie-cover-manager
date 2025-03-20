"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Save, X, Search, RefreshCw, Video } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import type { HD, Show } from "@/lib/types"

export function AddShow() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [hds, setHds] = useState<HD[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    imdbId: "",
    hdId: "",
    poster: "",
    year: "",
    duration: "",
    genres: "",
    director: "",
    performers: "",
    venue: "",
  })

  // Load HDs from localStorage on mount
  useState(() => {
    const storedHds = localStorage.getItem("hds")
    if (storedHds) {
      setHds(JSON.parse(storedHds))
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleHdChange = (value: string) => {
    setFormData({ ...formData, hdId: value })
  }

  const searchShows = async () => {
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock search results
      const mockResults = [
        {
          id: "mock-1",
          title: `${searchQuery} - Live in Concert`,
          year: 2023,
          poster_path: null,
          venue: "Arena Stadium",
        },
        {
          id: "mock-2",
          title: `${searchQuery} World Tour`,
          year: 2022,
          poster_path: null,
          venue: "Madison Square Garden",
        },
        {
          id: "mock-3",
          title: `The Best of ${searchQuery}`,
          year: 2021,
          poster_path: null,
          venue: "Royal Albert Hall",
        },
      ]

      setSearchResults(mockResults)
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
    setFormData({
      title: show.title,
      imdbId: `show-${show.id}`,
      hdId: formData.hdId,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : "",
      year: show.year ? show.year.toString() : "",
      duration: "120",
      genres: "Música, Performance",
      director: "Vários",
      performers: "Vários artistas",
      venue: show.venue || "Local desconhecido",
    })
    setSearchResults([])
    setSearchQuery("")
  }

  const saveShow = () => {
    if (!formData.title || !formData.hdId) {
      toast({
        title: "Erro",
        description: "Título e HD são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Get existing shows
    const storedShows = localStorage.getItem("shows")
    const allShows = storedShows ? JSON.parse(storedShows) : []

    // Create new show
    const newShow: Show = {
      id: Date.now().toString(),
      title: formData.title,
      hdId: formData.hdId,
      hidden: false,
      imdbId: formData.imdbId || `show-${Date.now()}`,
      poster: formData.poster || "/placeholder.svg?height=450&width=300",
      year: formData.year ? Number.parseInt(formData.year) : new Date().getFullYear(),
      duration: formData.duration ? Number.parseInt(formData.duration) : 120,
      watched: false,
      genres: formData.genres
        ? formData.genres
            .split(",")
            .map((g) => g.trim())
            .filter((g) => g)
        : ["Música", "Performance"],
      director: formData.director || "Vários",
      performers: formData.performers
        ? formData.performers
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p)
        : ["Vários artistas"],
      venue: formData.venue || "Local desconhecido",
    }

    // Add to localStorage
    allShows.push(newShow)
    localStorage.setItem("shows", JSON.stringify(allShows))

    // Reset form and close dialog
    setFormData({
      title: "",
      imdbId: "",
      hdId: "",
      poster: "",
      year: "",
      duration: "",
      genres: "",
      director: "",
      performers: "",
      venue: "",
    })
    setDialogOpen(false)

    toast({
      title: "Show Adicionado",
      description: `${formData.title} foi adicionado com sucesso.`,
    })

    // Reload the page to show the new show
    window.location.reload()
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Show
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Show</DialogTitle>
            <DialogDescription>Adicione um novo show, concerto ou performance à sua coleção</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Buscar Show</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por um show..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={searchShows} disabled={isSearching}>
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
                          alt={show.title}
                          className="h-16 w-10 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-10 bg-blue-100 flex items-center justify-center rounded">
                          <Video className="h-6 w-6 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{show.title}</div>
                        <div className="text-xs text-gray-500">
                          {show.year} - {show.venue}
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
                placeholder="Rock in Rio 2023"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imdbId">ID (opcional)</Label>
              <Input
                id="imdbId"
                name="imdbId"
                value={formData.imdbId}
                onChange={handleInputChange}
                placeholder="show-123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hdId">HD de Armazenamento</Label>
              <Select value={formData.hdId} onValueChange={handleHdChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o HD" />
                </SelectTrigger>
                <SelectContent>
                  {hds.map((hd) => (
                    <SelectItem key={hd.id} value={hd.id}>
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: hd.color }} />
                        {hd.name} {hd.connected ? "(Conectado)" : "(Desconectado)"}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poster">URL da Capa (opcional)</Label>
              <Input
                id="poster"
                name="poster"
                value={formData.poster}
                onChange={handleInputChange}
                placeholder="https://example.com/poster.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Input id="year" name="year" value={formData.year} onChange={handleInputChange} placeholder="2023" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="120"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genres">Gêneros (separados por vírgula)</Label>
              <Input
                id="genres"
                name="genres"
                value={formData.genres}
                onChange={handleInputChange}
                placeholder="Música, Performance, Festival"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="director">Diretor</Label>
              <Input
                id="director"
                name="director"
                value={formData.director}
                onChange={handleInputChange}
                placeholder="Nome do diretor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="performers">Artistas (separados por vírgula)</Label>
              <Input
                id="performers"
                name="performers"
                value={formData.performers}
                onChange={handleInputChange}
                placeholder="Artista 1, Artista 2, Banda 3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Local</Label>
              <Input
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                placeholder="Cidade do Rock, Rio de Janeiro"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={saveShow}>
              <Save className="mr-2 h-4 w-4" />
              Adicionar Show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


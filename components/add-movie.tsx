"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Save, X, Search, RefreshCw, Film } from "lucide-react"
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
import type { HD, Movie } from "@/lib/types"

export function AddMovie() {
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
  })

  // Load HDs from localStorage
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
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}`,
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        setSearchResults(data.results)
      } else {
        toast({
          title: "Nenhum Resultado",
          description: "Nenhum filme encontrado com esse termo de busca.",
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

  const selectMovie = (movie: any) => {
    setFormData({
      title: movie.title,
      imdbId: `tmdb-${movie.id}`, // Using TMDb ID with prefix
      hdId: formData.hdId,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "",
      year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "",
      duration: movie.runtime ? movie.runtime.toString() : "",
      genres: movie.genre_ids ? movie.genre_ids.join(",") : "",
    })
    setSearchResults([])
    setSearchQuery("")
  }

  const saveMovie = () => {
    if (!formData.title || !formData.hdId) {
      toast({
        title: "Erro",
        description: "Título e HD são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Get existing movies
    const storedMovies = localStorage.getItem("movies")
    const allMovies = storedMovies ? JSON.parse(storedMovies) : []

    // Create new movie
    const newMovie: Movie = {
      id: Date.now().toString(),
      title: formData.title,
      hdId: formData.hdId,
      hidden: false,
      imdbId: formData.imdbId || `unknown-${Date.now()}`,
      poster: formData.poster || "/placeholder.svg?height=450&width=300",
      year: formData.year ? Number.parseInt(formData.year) : new Date().getFullYear(),
      duration: formData.duration ? Number.parseInt(formData.duration) : 120,
      watched: false,
      genres: formData.genres
        ? formData.genres
            .split(",")
            .map((g) => g.trim())
            .filter((g) => g)
        : [],
    }

    // Add to localStorage
    allMovies.push(newMovie)
    localStorage.setItem("movies", JSON.stringify(allMovies))

    // Reset form and close dialog
    setFormData({
      title: "",
      imdbId: "",
      hdId: "",
      poster: "",
      year: "",
      duration: "",
      genres: "",
    })
    setDialogOpen(false)

    toast({
      title: "Filme Adicionado",
      description: `${formData.title} foi adicionado com sucesso.`,
    })

    // Reload the page to show the new movie
    window.location.reload()
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Filme
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Filme</DialogTitle>
            <DialogDescription>Adicione um novo filme à sua coleção</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Buscar no TMDb</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por um filme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
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
                  {searchResults.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer"
                      onClick={() => selectMovie(movie)}
                    >
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          className="h-16 w-10 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-10 bg-blue-100 flex items-center justify-center rounded">
                          <Film className="h-6 w-6 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{movie.title}</div>
                        <div className="text-xs text-gray-500">
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : "Ano desconhecido"}
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
                placeholder="O Poderoso Chefão"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imdbId">IMDb ID (opcional)</Label>
              <Input
                id="imdbId"
                name="imdbId"
                value={formData.imdbId}
                onChange={handleInputChange}
                placeholder="tt0068646"
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
                placeholder="https://image.tmdb.org/t/p/w500/poster.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Input id="year" name="year" value={formData.year} onChange={handleInputChange} placeholder="1972" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="175"
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
                placeholder="Drama, Crime"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={saveMovie}>
              <Save className="mr-2 h-4 w-4" />
              Adicionar Filme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


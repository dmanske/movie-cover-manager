"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Edit,
  Search,
  Clock,
  Play,
  Check,
  RefreshCw,
  Calendar,
  Star,
  Film,
  User,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileBrowser } from "@/components/file-browser"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { HD, Movie } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface MovieDetailProps {
  id: string
}

export function MovieDetail({ id }: MovieDetailProps) {
  const { toast } = useToast()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [hd, setHd] = useState<HD | null>(null)
  const [isLoadingImdb, setIsLoadingImdb] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: "",
    imdbId: "",
    poster: "",
    synopsis: "",
    genres: "",
    year: "",
    director: "",
    duration: "",
    filename: "",
  })

  useEffect(() => {
    // Load data from localStorage
    const storedMovies = localStorage.getItem("movies")
    const storedHds = localStorage.getItem("hds")

    if (storedMovies) {
      const allMovies = JSON.parse(storedMovies)
      const foundMovie = allMovies.find((m: Movie) => m.id === id)
      setMovie(foundMovie || null)

      if (foundMovie) {
        setEditFormData({
          title: foundMovie.title || "",
          imdbId: foundMovie.imdbId || "",
          poster: foundMovie.poster || "",
          synopsis: foundMovie.synopsis || "",
          genres: foundMovie.genres ? foundMovie.genres.join(", ") : "",
          year: foundMovie.year ? foundMovie.year.toString() : "",
          director: foundMovie.director || "",
          duration: foundMovie.duration ? foundMovie.duration.toString() : "",
          filename: foundMovie.filename || "",
        })

        if (storedHds) {
          const allHds = JSON.parse(storedHds)
          const foundHd = allHds.find((h: HD) => h.id === foundMovie.hdId)
          setHd(foundHd || null)
        }
      }
    }
  }, [id])

  const toggleMovieVisibility = () => {
    if (!movie) return

    const storedMovies = localStorage.getItem("movies")
    if (!storedMovies) return

    const allMovies = JSON.parse(storedMovies)
    const updatedMovies = allMovies.map((m: Movie) => (m.id === movie.id ? { ...m, hidden: !m.hidden } : m))

    localStorage.setItem("movies", JSON.stringify(updatedMovies))
    setMovie({ ...movie, hidden: !movie.hidden })

    toast({
      title: "Filme Atualizado",
      description: `A visibilidade do filme foi alterada.`,
    })
  }

  const toggleMovieWatched = () => {
    if (!movie) return

    const storedMovies = localStorage.getItem("movies")
    if (!storedMovies) return

    const allMovies = JSON.parse(storedMovies)
    const updatedMovies = allMovies.map((m: Movie) => (m.id === movie.id ? { ...m, watched: !m.watched } : m))

    localStorage.setItem("movies", JSON.stringify(updatedMovies))
    setMovie({ ...movie, watched: !movie.watched })

    toast({
      title: "Filme Atualizado",
      description: `O filme foi marcado como ${!movie.watched ? "assistido" : "não assistido"}.`,
    })
  }

  const updateMovieFromImdb = async () => {
    if (!movie) return

    const apiKey = localStorage.getItem("imdbApiKey")
    if (!apiKey) {
      toast({
        title: "Chave de API Ausente",
        description: "Por favor, adicione sua chave de API do TMDb nas configurações primeiro.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingImdb(true)

    try {
      // First, search for the movie by title to get TMDb ID
      const searchResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movie.title)}${movie.year ? `&year=${movie.year}` : ""}`,
      )
      const searchData = await searchResponse.json()

      if (searchData.results && searchData.results.length > 0) {
        // Get the first result's ID
        const tmdbId = searchData.results[0].id

        // Fetch detailed movie data
        const detailResponse = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}`)
        const data = await detailResponse.json()

        if (data.id) {
          // Update movie with TMDb data
          const storedMovies = localStorage.getItem("movies")
          if (!storedMovies) return

          const allMovies = JSON.parse(storedMovies)
          const movieCopy = { ...movie }

          // Update movie metadata
          if (data.poster_path) {
            movieCopy.poster = `https://image.tmdb.org/t/p/w500${data.poster_path}`
          }

          movieCopy.synopsis = data.overview || movieCopy.synopsis
          movieCopy.genres = data.genres?.map((g: any) => g.name) || movieCopy.genres
          movieCopy.year = data.release_date ? new Date(data.release_date).getFullYear() : movieCopy.year
          movieCopy.director = data.credits?.crew?.find((c: any) => c.job === "Director")?.name || movieCopy.director
          movieCopy.imdbRating = data.vote_average || movieCopy.imdbRating
          movieCopy.releaseDate = data.release_date || movieCopy.releaseDate
          movieCopy.duration = data.runtime || movieCopy.duration

          // Update the edit form data
          setEditFormData({
            title: movieCopy.title,
            imdbId: movieCopy.imdbId,
            poster: movieCopy.poster,
            synopsis: movieCopy.synopsis || "",
            genres: movieCopy.genres ? movieCopy.genres.join(", ") : "",
            year: movieCopy.year ? movieCopy.year.toString() : "",
            director: movieCopy.director || "",
            duration: movieCopy.duration ? movieCopy.duration.toString() : "",
            filename: movieCopy.filename || "",
          })

          // Update the movie in state and localStorage
          const updatedMovies = allMovies.map((m: Movie) => (m.id === movie.id ? movieCopy : m))

          localStorage.setItem("movies", JSON.stringify(updatedMovies))
          setMovie(movieCopy)

          toast({
            title: "Filme Atualizado",
            description: `Metadados para "${data.title}" foram atualizados do TMDb.`,
          })
        } else {
          toast({
            title: "Erro",
            description: `Falha ao buscar dados do TMDb: ${data.status_message || "Erro desconhecido"}`,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Filme Não Encontrado",
          description: `Não foi possível encontrar "${movie.title}" no TMDb.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Falha ao buscar dados do TMDb: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoadingImdb(false)
    }
  }

  const handleFileSelect = (filePath: string) => {
    if (!movie) return

    const storedMovies = localStorage.getItem("movies")
    if (!storedMovies) return

    const allMovies = JSON.parse(storedMovies)
    const movieCopy = { ...movie, filename: filePath }

    // Update the movie in state and localStorage
    const updatedMovies = allMovies.map((m: Movie) => (m.id === movie.id ? movieCopy : m))

    localStorage.setItem("movies", JSON.stringify(updatedMovies))
    setMovie(movieCopy)

    toast({
      title: "Arquivo Associado",
      description: `O arquivo foi associado ao filme.`,
    })
  }

  const openEditDialog = () => {
    if (!movie) return

    setEditFormData({
      title: movie.title,
      imdbId: movie.imdbId || "",
      poster: movie.poster || "",
      synopsis: movie.synopsis || "",
      genres: movie.genres ? movie.genres.join(", ") : "",
      year: movie.year ? movie.year.toString() : "",
      director: movie.director || "",
      duration: movie.duration ? movie.duration.toString() : "",
      filename: movie.filename || "",
    })

    setEditDialogOpen(true)
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData({
      ...editFormData,
      [name]: value,
    })
  }

  const saveMovieEdit = () => {
    if (!movie) return

    const storedMovies = localStorage.getItem("movies")
    if (!storedMovies) return

    const allMovies = JSON.parse(storedMovies)
    const movieCopy = { ...movie }

    // Update movie with form data
    movieCopy.title = editFormData.title
    movieCopy.imdbId = editFormData.imdbId
    movieCopy.poster = editFormData.poster
    movieCopy.synopsis = editFormData.synopsis
    movieCopy.genres = editFormData.genres
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g)
    movieCopy.year = editFormData.year ? Number.parseInt(editFormData.year) : movie.year
    movieCopy.director = editFormData.director
    movieCopy.duration = editFormData.duration ? Number.parseInt(editFormData.duration) : movie.duration
    movieCopy.filename = editFormData.filename

    // Update the movie in state and localStorage
    const updatedMovies = allMovies.map((m: Movie) => (m.id === movie.id ? movieCopy : m))

    localStorage.setItem("movies", JSON.stringify(updatedMovies))
    setMovie(movieCopy)
    setEditDialogOpen(false)

    toast({
      title: "Filme Atualizado",
      description: "As informações do filme foram atualizadas com sucesso.",
    })
  }

  const deleteMovie = () => {
    if (!movie) return

    if (confirm("Tem certeza que deseja remover este filme?")) {
      const storedMovies = localStorage.getItem("movies")
      if (!storedMovies) return

      const allMovies = JSON.parse(storedMovies)
      const updatedMovies = allMovies.filter((m: Movie) => m.id !== movie.id)

      localStorage.setItem("movies", JSON.stringify(updatedMovies))

      toast({
        title: "Filme Removido",
        description: "O filme foi removido com sucesso.",
        variant: "destructive",
      })

      // Redirect to movies page
      window.location.href = "/movies"
    }
  }

  const playMovie = () => {
    if (!movie) return

    if (typeof window !== "undefined" && window.electronAPI && movie.filename) {
      // Usar a API do Electron para reproduzir o arquivo
      window.electronAPI
        .playMedia(movie.filename)
        .then((result) => {
          if (!result.success) {
            toast({
              title: "Erro",
              description: `Não foi possível reproduzir o arquivo: ${result.error}`,
              variant: "destructive",
            })
          }
        })
        .catch((error) => {
          toast({
            title: "Erro",
            description: "Falha ao reproduzir o arquivo",
            variant: "destructive",
          })
        })
    } else {
      // Fallback para web
      toast({
        title: "Reproduzindo Filme",
        description: `Reproduzindo: ${movie.title}`,
      })
    }
  }

  if (!movie) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
        <p className="text-blue-700">Filme não encontrado.</p>
        <Button variant="link" asChild>
          <Link href="/movies">Voltar para Biblioteca de Filmes</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/movies">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-blue-900">{movie.title}</h1>
        {movie.year && <span className="text-lg text-blue-600">({movie.year})</span>}
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg border border-blue-100">
            <img
              src={movie.poster || "/placeholder.svg?height=450&width=300"}
              alt={movie.title}
              className="aspect-[2/3] w-full object-cover"
            />

            <div className="absolute right-2 top-2 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={toggleMovieVisibility}
              >
                {movie.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span className="sr-only">{movie.hidden ? "Mostrar filme" : "Ocultar filme"}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={openEditDialog}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Editar filme</span>
              </Button>
            </div>

            {movie.watched && (
              <div className="absolute bottom-2 right-2">
                <Badge className="bg-green-500 text-white">Assistido</Badge>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <h3 className="mb-2 font-medium text-blue-900">Informações do Filme</h3>

            <div className="space-y-3 text-sm">
              {movie.genres && movie.genres.length > 0 && (
                <div>
                  <div className="text-blue-600">Gêneros</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {movie.genres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {movie.director && (
                <div>
                  <div className="text-blue-600">Diretor</div>
                  <div>{movie.director}</div>
                </div>
              )}

              <div>
                <div className="text-blue-600">IMDb ID</div>
                <div className="flex items-center gap-2">
                  <span>{movie.imdbId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-600"
                    onClick={updateMovieFromImdb}
                    disabled={isLoadingImdb}
                  >
                    {isLoadingImdb ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">Atualizar do TMDb</span>
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-blue-600">Armazenamento</div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hd?.color || "#3B82F6" }} />
                  <span>{hd?.name || "HD Desconhecido"}</span>
                  <Badge variant={hd?.connected ? "default" : "destructive"} className="ml-1 text-[10px]">
                    {hd?.connected ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
              </div>

              {movie.duration && (
                <div>
                  <div className="text-blue-600">Duração</div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>{movie.duration} minutos</span>
                  </div>
                </div>
              )}

              {movie.imdbRating && (
                <div>
                  <div className="text-blue-600">Avaliação IMDb</div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    <span>{movie.imdbRating}/10</span>
                  </div>
                </div>
              )}

              {movie.releaseDate && (
                <div>
                  <div className="text-blue-600">Data de Lançamento</div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span>{movie.releaseDate}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="text-blue-600">Status</div>
                <div>
                  <Badge variant={movie.watched ? "success" : "outline"}>
                    {movie.watched ? "Assistido" : "Não Assistido"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {movie.synopsis && (
            <div className="rounded-lg border border-blue-100 bg-white p-4">
              <h3 className="mb-2 font-medium text-blue-900">Sinopse</h3>
              <p className="text-sm text-blue-700">{movie.synopsis}</p>
            </div>
          )}

          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <h3 className="mb-3 font-medium text-blue-900">Explorar Arquivos</h3>
            <FileBrowser hdId={movie.hdId} onFileSelect={handleFileSelect} showFolders={true} showFiles={true} />
          </div>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Detalhes & Elenco</TabsTrigger>
              <TabsTrigger value="file">Arquivo & Reprodução</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <div className="rounded-lg border border-blue-100 bg-white p-4">
                <h3 className="mb-3 font-medium text-blue-900">Detalhes do Filme</h3>

                {movie.synopsis ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-blue-800">Sinopse</h4>
                    <p className="mt-1 text-sm text-blue-700">{movie.synopsis}</p>
                  </div>
                ) : (
                  <p className="text-blue-700">
                    Informações detalhadas não disponíveis. Clique no botão "Atualizar do TMDb" para buscar mais
                    detalhes.
                  </p>
                )}

                {movie.cast && movie.cast.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-blue-800">Elenco Principal</h4>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {movie.cast.map((actor, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{actor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-center">
                  <Button onClick={updateMovieFromImdb} disabled={isLoadingImdb}>
                    {isLoadingImdb ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Atualizar do TMDb
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="file" className="mt-4">
              <div className="rounded-lg border border-blue-100 bg-white p-4">
                <h3 className="mb-3 font-medium text-blue-900">Arquivo do Filme</h3>

                {movie.filename ? (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-blue-800">Nome do Arquivo</h4>
                      <div className="mt-1 rounded-md bg-blue-50 p-2 text-sm font-mono text-blue-800">
                        {movie.filename}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row">
                      <Button className="flex-1" onClick={playMovie}>
                        <Play className="mr-2 h-4 w-4" />
                        Reproduzir Filme
                      </Button>

                      <Button variant="outline" className="flex-1" onClick={() => handleFileSelect("")}>
                        <Edit className="mr-2 h-4 w-4" />
                        Alterar Arquivo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
                    <Film className="mb-2 h-10 w-10 text-blue-400" />
                    <p className="text-blue-700">Nenhum arquivo associado a este filme.</p>
                    <p className="text-sm text-blue-600">Use o explorador de arquivos para selecionar um arquivo.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-lg border border-blue-100 bg-white p-4">
                <h3 className="mb-3 font-medium text-blue-900">Ações</h3>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={toggleMovieWatched}>
                    <Check className={`mr-2 h-4 w-4 ${movie.watched ? "text-green-600" : ""}`} />
                    Marcar como {movie.watched ? "Não Assistido" : "Assistido"}
                  </Button>

                  <Button variant="outline" onClick={openEditDialog}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Informações
                  </Button>

                  <Button variant="destructive" onClick={deleteMovie}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Filme
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Filme</DialogTitle>
            <DialogDescription>Atualize as informações do filme</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" value={editFormData.title} onChange={handleEditInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imdbId">IMDb ID</Label>
              <Input id="imdbId" name="imdbId" value={editFormData.imdbId} onChange={handleEditInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="poster">URL da Capa</Label>
              <Input id="poster" name="poster" value={editFormData.poster} onChange={handleEditInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="year">Ano</Label>
              <Input id="year" name="year" value={editFormData.year} onChange={handleEditInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input id="duration" name="duration" value={editFormData.duration} onChange={handleEditInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="genres">Gêneros (separados por vírgula)</Label>
              <Input id="genres" name="genres" value={editFormData.genres} onChange={handleEditInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="director">Diretor</Label>
              <Input id="director" name="director" value={editFormData.director} onChange={handleEditInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="filename">Nome do Arquivo</Label>
              <Input id="filename" name="filename" value={editFormData.filename} onChange={handleEditInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="synopsis">Sinopse</Label>
              <Textarea
                id="synopsis"
                name="synopsis"
                value={editFormData.synopsis}
                onChange={handleEditInputChange}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveMovieEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


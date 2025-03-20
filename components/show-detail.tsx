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
  Star,
  Video,
  Trash2,
  MapPin,
  Music,
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
import type { HD, Show } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ShowDetailProps {
  id: string
}

export function ShowDetail({ id }: ShowDetailProps) {
  const { toast } = useToast()
  const [show, setShow] = useState<Show | null>(null)
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
    performers: "",
    venue: "",
  })

  useEffect(() => {
    // Load data from localStorage
    const storedShows = localStorage.getItem("shows")
    const storedHds = localStorage.getItem("hds")

    if (storedShows) {
      const allShows = JSON.parse(storedShows)
      const foundShow = allShows.find((s: Show) => s.id === id)
      setShow(foundShow || null)

      if (foundShow) {
        setEditFormData({
          title: foundShow.title || "",
          imdbId: foundShow.imdbId || "",
          poster: foundShow.poster || "",
          synopsis: foundShow.synopsis || "",
          genres: foundShow.genres ? foundShow.genres.join(", ") : "",
          year: foundShow.year ? foundShow.year.toString() : "",
          director: foundShow.director || "",
          duration: foundShow.duration ? foundShow.duration.toString() : "",
          filename: foundShow.filename || "",
          performers: foundShow.performers ? foundShow.performers.join(", ") : "",
          venue: foundShow.venue || "",
        })

        if (storedHds) {
          const allHds = JSON.parse(storedHds)
          const foundHd = allHds.find((h: HD) => h.id === foundShow.hdId)
          setHd(foundHd || null)
        }
      }
    }
  }, [id])

  const toggleShowVisibility = () => {
    if (!show) return

    const storedShows = localStorage.getItem("shows")
    if (!storedShows) return

    const allShows = JSON.parse(storedShows)
    const updatedShows = allShows.map((s: Show) => (s.id === show.id ? { ...s, hidden: !s.hidden } : s))

    localStorage.setItem("shows", JSON.stringify(updatedShows))
    setShow({ ...show, hidden: !show.hidden })

    toast({
      title: "Show Atualizado",
      description: `A visibilidade do show foi alterada.`,
    })
  }

  const toggleShowWatched = () => {
    if (!show) return

    const storedShows = localStorage.getItem("shows")
    if (!storedShows) return

    const allShows = JSON.parse(storedShows)
    const updatedShows = allShows.map((s: Show) => (s.id === show.id ? { ...s, watched: !s.watched } : s))

    localStorage.setItem("shows", JSON.stringify(updatedShows))
    setShow({ ...show, watched: !show.watched })

    toast({
      title: "Show Atualizado",
      description: `O show foi marcado como ${!show.watched ? "assistido" : "não assistido"}.`,
    })
  }

  const updateShowFromImdb = async () => {
    if (!show) return

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
      // Simulate API call for shows
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update show with simulated data
      const storedShows = localStorage.getItem("shows")
      if (!storedShows) return

      const allShows = JSON.parse(storedShows)
      const showCopy = { ...show }

      // Update show metadata with simulated data
      showCopy.synopsis = "Este é um show incrível com performances espetaculares. Atualizado via API."
      showCopy.genres = ["Música", "Performance", "Ao Vivo"]
      showCopy.director = "Diretor Atualizado"
      showCopy.performers = ["Artista 1", "Artista 2", "Artista 3"]
      showCopy.venue = "Local Atualizado"
      showCopy.imdbRating = 8.5

      // Update the edit form data
      setEditFormData({
        title: showCopy.title,
        imdbId: showCopy.imdbId,
        poster: showCopy.poster,
        synopsis: showCopy.synopsis || "",
        genres: showCopy.genres ? showCopy.genres.join(", ") : "",
        year: showCopy.year ? showCopy.year.toString() : "",
        director: showCopy.director || "",
        duration: showCopy.duration ? showCopy.duration.toString() : "",
        filename: showCopy.filename || "",
        performers: showCopy.performers ? showCopy.performers.join(", ") : "",
        venue: showCopy.venue || "",
      })

      // Update the show in state and localStorage
      const updatedShows = allShows.map((s: Show) => (s.id === show.id ? showCopy : s))

      localStorage.setItem("shows", JSON.stringify(updatedShows))
      setShow(showCopy)

      toast({
        title: "Show Atualizado",
        description: `Metadados para "${show.title}" foram atualizados.`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: `Falha ao buscar dados: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoadingImdb(false)
    }
  }

  const handleFileSelect = (filePath: string) => {
    if (!show) return

    const storedShows = localStorage.getItem("shows")
    if (!storedShows) return

    const allShows = JSON.parse(storedShows)
    const showCopy = { ...show, filename: filePath }

    // Update the show in state and localStorage
    const updatedShows = allShows.map((s: Show) => (s.id === show.id ? showCopy : s))

    localStorage.setItem("shows", JSON.stringify(updatedShows))
    setShow(showCopy)

    toast({
      title: "Arquivo Associado",
      description: `O arquivo foi associado ao show.`,
    })
  }

  const openEditDialog = () => {
    if (!show) return

    setEditFormData({
      title: show.title,
      imdbId: show.imdbId || "",
      poster: show.poster || "",
      synopsis: show.synopsis || "",
      genres: show.genres ? show.genres.join(", ") : "",
      year: show.year ? show.year.toString() : "",
      director: show.director || "",
      duration: show.duration ? show.duration.toString() : "",
      filename: show.filename || "",
      performers: show.performers ? show.performers.join(", ") : "",
      venue: show.venue || "",
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

  const saveShowEdit = () => {
    if (!show) return

    const storedShows = localStorage.getItem("shows")
    if (!storedShows) return

    const allShows = JSON.parse(storedShows)
    const showCopy = { ...show }

    // Update show with form data
    showCopy.title = editFormData.title
    showCopy.imdbId = editFormData.imdbId
    showCopy.poster = editFormData.poster
    showCopy.synopsis = editFormData.synopsis
    showCopy.genres = editFormData.genres
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g)
    showCopy.year = editFormData.year ? Number.parseInt(editFormData.year) : show.year
    showCopy.director = editFormData.director
    showCopy.duration = editFormData.duration ? Number.parseInt(editFormData.duration) : show.duration
    showCopy.filename = editFormData.filename
    showCopy.performers = editFormData.performers
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p)
    showCopy.venue = editFormData.venue

    // Update the show in state and localStorage
    const updatedShows = allShows.map((s: Show) => (s.id === show.id ? showCopy : s))

    localStorage.setItem("shows", JSON.stringify(updatedShows))
    setShow(showCopy)
    setEditDialogOpen(false)

    toast({
      title: "Show Atualizado",
      description: "As informações do show foram atualizadas com sucesso.",
    })
  }

  const deleteShow = () => {
    if (!show) return

    if (confirm("Tem certeza que deseja remover este show?")) {
      const storedShows = localStorage.getItem("shows")
      if (!storedShows) return

      const allShows = JSON.parse(storedShows)
      const updatedShows = allShows.filter((s: Show) => s.id !== show.id)

      localStorage.setItem("shows", JSON.stringify(updatedShows))

      toast({
        title: "Show Removido",
        description: "O show foi removido com sucesso.",
        variant: "destructive",
      })

      // Redirect to shows page
      window.location.href = "/shows"
    }
  }

  const playShow = () => {
    if (!show) return

    // In a real application, this would launch the system's default video player
    // For this demo, we'll just show a toast
    toast({
      title: "Reproduzindo Show",
      description: `Reproduzindo: ${show.title}`,
    })
  }

  if (!show) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
        <p className="text-blue-700">Show não encontrado.</p>
        <Button variant="link" asChild>
          <Link href="/shows">Voltar para Biblioteca de Shows</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/shows">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-blue-900">{show.title}</h1>
        {show.year && <span className="text-lg text-blue-600">({show.year})</span>}
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg border border-blue-100">
            <img
              src={show.poster || "/placeholder.svg?height=450&width=300"}
              alt={show.title}
              className="aspect-[2/3] w-full object-cover"
            />

            <div className="absolute right-2 top-2 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={toggleShowVisibility}
              >
                {show.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span className="sr-only">{show.hidden ? "Mostrar show" : "Ocultar show"}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={openEditDialog}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Editar show</span>
              </Button>
            </div>

            {show.watched && (
              <div className="absolute bottom-2 right-2">
                <Badge className="bg-green-500 text-white">Assistido</Badge>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <h3 className="mb-2 font-medium text-blue-900">Informações do Show</h3>

            <div className="space-y-3 text-sm">
              {show.genres && show.genres.length > 0 && (
                <div>
                  <div className="text-blue-600">Gêneros</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {show.genres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {show.director && (
                <div>
                  <div className="text-blue-600">Diretor</div>
                  <div>{show.director}</div>
                </div>
              )}

              {show.venue && (
                <div>
                  <div className="text-blue-600">Local</div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <span>{show.venue}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="text-blue-600">IMDb ID</div>
                <div className="flex items-center gap-2">
                  <span>{show.imdbId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-600"
                    onClick={updateShowFromImdb}
                    disabled={isLoadingImdb}
                  >
                    {isLoadingImdb ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">Atualizar dados</span>
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

              {show.duration && (
                <div>
                  <div className="text-blue-600">Duração</div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>{show.duration} minutos</span>
                  </div>
                </div>
              )}

              {show.imdbRating && (
                <div>
                  <div className="text-blue-600">Avaliação IMDb</div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    <span>{show.imdbRating}/10</span>
                  </div>
                </div>
              )}

              <div>
                <div className="text-blue-600">Status</div>
                <div>
                  <Badge variant={show.watched ? "success" : "outline"}>
                    {show.watched ? "Assistido" : "Não Assistido"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {show.synopsis && (
            <div className="rounded-lg border border-blue-100 bg-white p-4">
              <h3 className="mb-2 font-medium text-blue-900">Sinopse</h3>
              <p className="text-sm text-blue-700">{show.synopsis}</p>
            </div>
          )}

          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <h3 className="mb-3 font-medium text-blue-900">Explorar Arquivos</h3>
            <FileBrowser hdId={show.hdId} onFileSelect={handleFileSelect} showFolders={true} showFiles={true} />
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
                <h3 className="mb-3 font-medium text-blue-900">Detalhes do Show</h3>

                {show.synopsis ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-blue-800">Sinopse</h4>
                    <p className="mt-1 text-sm text-blue-700">{show.synopsis}</p>
                  </div>
                ) : (
                  <p className="text-blue-700">
                    Informações detalhadas não disponíveis. Clique no botão "Atualizar dados" para buscar mais detalhes.
                  </p>
                )}

                {show.performers && show.performers.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-blue-800">Artistas</h4>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {show.performers.map((performer, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{performer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-center">
                  <Button onClick={updateShowFromImdb} disabled={isLoadingImdb}>
                    {isLoadingImdb ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Atualizar dados
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="file" className="mt-4">
              <div className="rounded-lg border border-blue-100 bg-white p-4">
                <h3 className="mb-3 font-medium text-blue-900">Arquivo do Show</h3>

                {show.filename ? (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-blue-800">Nome do Arquivo</h4>
                      <div className="mt-1 rounded-md bg-blue-50 p-2 text-sm font-mono text-blue-800">
                        {show.filename}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row">
                      <Button className="flex-1" onClick={playShow}>
                        <Play className="mr-2 h-4 w-4" />
                        Reproduzir Show
                      </Button>

                      <Button variant="outline" className="flex-1" onClick={() => handleFileSelect("")}>
                        <Edit className="mr-2 h-4 w-4" />
                        Alterar Arquivo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
                    <Video className="mb-2 h-10 w-10 text-blue-400" />
                    <p className="text-blue-700">Nenhum arquivo associado a este show.</p>
                    <p className="text-sm text-blue-600">Use o explorador de arquivos para selecionar um arquivo.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-lg border border-blue-100 bg-white p-4">
                <h3 className="mb-3 font-medium text-blue-900">Ações</h3>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={toggleShowWatched}>
                    <Check className={`mr-2 h-4 w-4 ${show.watched ? "text-green-600" : ""}`} />
                    Marcar como {show.watched ? "Não Assistido" : "Assistido"}
                  </Button>

                  <Button variant="outline" onClick={openEditDialog}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Informações
                  </Button>

                  <Button variant="destructive" onClick={deleteShow}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Show
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
            <DialogTitle>Editar Show</DialogTitle>
            <DialogDescription>Atualize as informações do show</DialogDescription>
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
              <Label htmlFor="performers">Artistas (separados por vírgula)</Label>
              <Input
                id="performers"
                name="performers"
                value={editFormData.performers}
                onChange={handleEditInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="venue">Local</Label>
              <Input id="venue" name="venue" value={editFormData.venue} onChange={handleEditInputChange} />
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
            <Button onClick={saveShowEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


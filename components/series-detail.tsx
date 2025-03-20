"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Edit, Search, Clock, Play, Info, Check, RefreshCw, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
import { Separator } from "@/components/ui/separator"
import { FileBrowser } from "@/components/file-browser"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { HD, Series, Episode } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface SeriesDetailProps {
  id: string
}

export function SeriesDetail({ id }: SeriesDetailProps) {
  const { toast } = useToast()
  const [series, setSeries] = useState<Series | null>(null)
  const [hd, setHd] = useState<HD | null>(null)
  const [episodeInfo, setEpisodeInfo] = useState<Episode | null>(null)
  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false)
  const [isLoadingImdb, setIsLoadingImdb] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: "",
    imdbId: "",
    poster: "",
    synopsis: "",
    genres: "",
    year: "",
    creator: "",
  })

  useEffect(() => {
    // Load data from localStorage
    const storedSeries = localStorage.getItem("series")
    const storedHds = localStorage.getItem("hds")

    if (storedSeries) {
      const allSeries = JSON.parse(storedSeries)
      const foundSeries = allSeries.find((s: Series) => s.id === id)
      setSeries(foundSeries || null)

      if (foundSeries) {
        setEditFormData({
          title: foundSeries.title || "",
          imdbId: foundSeries.imdbId || "",
          poster: foundSeries.poster || "",
          synopsis: foundSeries.synopsis || "",
          genres: foundSeries.genres ? foundSeries.genres.join(", ") : "",
          year: foundSeries.year ? foundSeries.year.toString() : "",
          creator: foundSeries.creator || "",
        })

        if (storedHds) {
          const allHds = JSON.parse(storedHds)
          const foundHd = allHds.find((h: HD) => h.id === foundSeries.hdId)
          setHd(foundHd || null)
        }
      }
    }
  }, [id])

  const toggleSeriesVisibility = () => {
    if (!series) return

    const storedSeries = localStorage.getItem("series")
    if (!storedSeries) return

    const allSeries = JSON.parse(storedSeries)
    const updatedSeries = allSeries.map((s: Series) => (s.id === series.id ? { ...s, hidden: !s.hidden } : s))

    localStorage.setItem("series", JSON.stringify(updatedSeries))
    setSeries({ ...series, hidden: !series.hidden })

    toast({
      title: "Série Atualizada",
      description: `A visibilidade da série foi alterada.`,
    })
  }

  const toggleEpisodeWatched = (seasonIndex: number, episodeIndex: number) => {
    if (!series) return

    const storedSeries = localStorage.getItem("series")
    if (!storedSeries) return

    const allSeries = JSON.parse(storedSeries)
    const seriesCopy = { ...series }

    // Toggle the watched status
    seriesCopy.seasons[seasonIndex].episodes[episodeIndex].watched =
      !seriesCopy.seasons[seasonIndex].episodes[episodeIndex].watched

    // Update the series in state and localStorage
    const updatedSeries = allSeries.map((s: Series) => (s.id === series.id ? seriesCopy : s))

    localStorage.setItem("series", JSON.stringify(updatedSeries))
    setSeries(seriesCopy)

    toast({
      title: "Episódio Atualizado",
      description: `Episódio marcado como ${
        seriesCopy.seasons[seasonIndex].episodes[episodeIndex].watched ? "assistido" : "não assistido"
      }.`,
    })
  }

  const showEpisodeInfo = (episode: Episode) => {
    setEpisodeInfo(episode)
    setEpisodeDialogOpen(true)
  }

  const calculateWatchProgress = () => {
    if (!series) return { totalEpisodes: 0, watchedEpisodes: 0, percentage: 0 }

    let totalEpisodes = 0
    let watchedEpisodes = 0

    series.seasons.forEach((season) => {
      season.episodes.forEach((episode) => {
        totalEpisodes++
        if (episode.watched) {
          watchedEpisodes++
        }
      })
    })

    return {
      totalEpisodes,
      watchedEpisodes,
      percentage: totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0,
    }
  }

  const calculateTotalWatchTime = () => {
    if (!series) return { total: 0, watched: 0, remaining: 0 }

    let totalMinutes = 0
    let watchedMinutes = 0

    series.seasons.forEach((season) => {
      season.episodes.forEach((episode) => {
        totalMinutes += episode.duration
        if (episode.watched) {
          watchedMinutes += episode.duration
        }
      })
    })

    return {
      total: totalMinutes,
      watched: watchedMinutes,
      remaining: totalMinutes - watchedMinutes,
      totalHours: Math.round(totalMinutes / 60),
      watchedHours: Math.round(watchedMinutes / 60),
      remainingHours: Math.round((totalMinutes - watchedMinutes) / 60),
      totalDays: Math.round((totalMinutes / 60 / 8) * 10) / 10,
      watchedDays: Math.round((watchedMinutes / 60 / 8) * 10) / 10,
      remainingDays: Math.round(((totalMinutes - watchedMinutes) / 60 / 8) * 10) / 10,
    }
  }

  const updateSeriesFromImdb = async () => {
    if (!series) return

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
      // First, search for the series by title to get TMDb ID
      const searchResponse = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(series.title)}`,
      )
      const searchData = await searchResponse.json()

      if (searchData.results && searchData.results.length > 0) {
        // Get the first result's ID
        const tmdbId = searchData.results[0].id

        // Fetch detailed series data
        const detailResponse = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}`)
        const data = await detailResponse.json()

        if (data.id) {
          // Update series with TMDb data
          const storedSeries = localStorage.getItem("series")
          if (!storedSeries) return

          const allSeries = JSON.parse(storedSeries)
          const seriesCopy = { ...series }

          // Update series metadata
          if (data.poster_path) {
            seriesCopy.poster = `https://image.tmdb.org/t/p/w500${data.poster_path}`
          }

          seriesCopy.synopsis = data.overview || seriesCopy.synopsis
          seriesCopy.genres = data.genres?.map((g: any) => g.name) || seriesCopy.genres
          seriesCopy.year = new Date(data.first_air_date).getFullYear() || seriesCopy.year
          seriesCopy.creator = data.created_by?.map((c: any) => c.name).join(", ") || seriesCopy.creator

          // Update the edit form data
          setEditFormData({
            title: seriesCopy.title,
            imdbId: seriesCopy.imdbId,
            poster: seriesCopy.poster,
            synopsis: seriesCopy.synopsis || "",
            genres: seriesCopy.genres ? seriesCopy.genres.join(", ") : "",
            year: seriesCopy.year ? seriesCopy.year.toString() : "",
            creator: seriesCopy.creator || "",
          })

          // Update the series in state and localStorage
          const updatedSeries = allSeries.map((s: Series) => (s.id === series.id ? seriesCopy : s))

          localStorage.setItem("series", JSON.stringify(updatedSeries))
          setSeries(seriesCopy)

          toast({
            title: "Série Atualizada",
            description: `Metadados para "${data.name}" foram atualizados do TMDb.`,
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
          title: "Série Não Encontrada",
          description: `Não foi possível encontrar "${series.title}" no TMDb.`,
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
    toast({
      title: "Arquivo Selecionado",
      description: `Arquivo selecionado: ${filePath}`,
    })

    // Here you would typically associate this file with an episode
    // For now, we'll just show a toast
  }

  const openEditDialog = () => {
    if (!series) return

    setEditFormData({
      title: series.title,
      imdbId: series.imdbId || "",
      poster: series.poster || "",
      synopsis: series.synopsis || "",
      genres: series.genres ? series.genres.join(", ") : "",
      year: series.year ? series.year.toString() : "",
      creator: series.creator || "",
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

  const saveSeriesEdit = () => {
    if (!series) return

    const storedSeries = localStorage.getItem("series")
    if (!storedSeries) return

    const allSeries = JSON.parse(storedSeries)
    const seriesCopy = { ...series }

    // Update series with form data
    seriesCopy.title = editFormData.title
    seriesCopy.imdbId = editFormData.imdbId
    seriesCopy.poster = editFormData.poster
    seriesCopy.synopsis = editFormData.synopsis
    seriesCopy.genres = editFormData.genres
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g)
    seriesCopy.year = editFormData.year ? Number.parseInt(editFormData.year) : undefined
    seriesCopy.creator = editFormData.creator

    // Update the series in state and localStorage
    const updatedSeries = allSeries.map((s: Series) => (s.id === series.id ? seriesCopy : s))

    localStorage.setItem("series", JSON.stringify(updatedSeries))
    setSeries(seriesCopy)
    setEditDialogOpen(false)

    toast({
      title: "Série Atualizada",
      description: "As informações da série foram atualizadas com sucesso.",
    })
  }

  const markAllEpisodesAsWatched = (seasonIndex: number, watched: boolean) => {
    if (!series) return

    const storedSeries = localStorage.getItem("series")
    if (!storedSeries) return

    const allSeries = JSON.parse(storedSeries)
    const seriesCopy = { ...series }

    // Update all episodes in the season
    seriesCopy.seasons[seasonIndex].episodes.forEach((episode) => {
      episode.watched = watched
    })

    // Update the series in state and localStorage
    const updatedSeries = allSeries.map((s: Series) => (s.id === series.id ? seriesCopy : s))

    localStorage.setItem("series", JSON.stringify(updatedSeries))
    setSeries(seriesCopy)

    toast({
      title: "Temporada Atualizada",
      description: `Todos os episódios da temporada ${seriesCopy.seasons[seasonIndex].number} foram marcados como ${watched ? "assistidos" : "não assistidos"}.`,
    })
  }

  const playEpisode = (episode: Episode) => {
    if (typeof window !== "undefined" && window.electronAPI && episode.filename) {
      // Usar a API do Electron para reproduzir o arquivo
      window.electronAPI
        .playMedia(episode.filename)
        .then((result) => {
          if (!result.success) {
            toast({
              title: "Erro",
              description: `Não foi possível reproduzir o episódio: ${result.error}`,
              variant: "destructive",
            })
          }
        })
        .catch((error) => {
          toast({
            title: "Erro",
            description: "Falha ao reproduzir o episódio",
            variant: "destructive",
          })
        })
    } else {
      // Fallback para web
      toast({
        title: "Reproduzindo Episódio",
        description: `Reproduzindo: ${episode.title}`,
      })
    }
  }

  if (!series) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
        <p className="text-blue-700">Série não encontrada.</p>
        <Button variant="link" asChild>
          <Link href="/series">Voltar para Biblioteca de Séries</Link>
        </Button>
      </div>
    )
  }

  const progress = calculateWatchProgress()
  const watchTime = calculateTotalWatchTime()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/series">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-blue-900">{series.title}</h1>
        {series.year && <span className="text-lg text-blue-600">({series.year})</span>}
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg border border-blue-100">
            <img
              src={series.poster || "/placeholder.svg?height=450&width=300"}
              alt={series.title}
              className="aspect-[2/3] w-full object-cover"
            />

            <div className="absolute right-2 top-2 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={toggleSeriesVisibility}
              >
                {series.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span className="sr-only">{series.hidden ? "Mostrar série" : "Ocultar série"}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={openEditDialog}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Editar série</span>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <h3 className="mb-2 font-medium text-blue-900">Informações da Série</h3>

            <div className="space-y-3 text-sm">
              {series.genres && series.genres.length > 0 && (
                <div>
                  <div className="text-blue-600">Gêneros</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {series.genres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {series.creator && (
                <div>
                  <div className="text-blue-600">Criador</div>
                  <div>{series.creator}</div>
                </div>
              )}

              <div>
                <div className="text-blue-600">IMDb ID</div>
                <div className="flex items-center gap-2">
                  <span>{series.imdbId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-600"
                    onClick={updateSeriesFromImdb}
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

              <div>
                <div className="text-blue-600">Progresso de Visualização</div>
                <div className="mt-1">
                  <Progress value={progress.percentage} className="h-2 bg-blue-100" />
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span>
                      {progress.watchedEpisodes} de {progress.totalEpisodes} episódios
                    </span>
                    <span>{progress.percentage}%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-blue-600">Tempo Total de Visualização</div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  <span>
                    {watchTime.totalHours} horas ({watchTime.totalDays} dias)
                  </span>
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  <div>
                    Assistido: {watchTime.watchedHours} horas ({watchTime.watchedDays} dias)
                  </div>
                  <div>
                    Restante: {watchTime.remainingHours} horas ({watchTime.remainingDays} dias)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {series.synopsis && (
            <div className="rounded-lg border border-blue-100 bg-white p-4">
              <h3 className="mb-2 font-medium text-blue-900">Sinopse</h3>
              <p className="text-sm text-blue-700">{series.synopsis}</p>
            </div>
          )}

          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <h3 className="mb-3 font-medium text-blue-900">Explorar Arquivos</h3>
            <FileBrowser hdId={series.hdId} onFileSelect={handleFileSelect} showFolders={true} showFiles={true} />
          </div>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="seasons" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="seasons">Temporadas & Episódios</TabsTrigger>
              <TabsTrigger value="details">Detalhes & Elenco</TabsTrigger>
            </TabsList>

            <TabsContent value="seasons" className="mt-4">
              <div className="space-y-6">
                {series.seasons.map((season, seasonIndex) => (
                  <div key={season.number} className="rounded-lg border border-blue-100 bg-white">
                    <div className="border-b border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-blue-900">Temporada {season.number}</h3>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-blue-600">
                            {season.availableEpisodes === season.totalEpisodes ? (
                              <div className="flex items-center gap-1">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>Completa ({season.totalEpisodes} episódios)</span>
                              </div>
                            ) : (
                              <span>
                                {season.availableEpisodes} de {season.totalEpisodes} episódios
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAllEpisodesAsWatched(seasonIndex, true)}
                              className="h-7 px-2 text-xs"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Marcar Todos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAllEpisodesAsWatched(seasonIndex, false)}
                              className="h-7 px-2 text-xs"
                            >
                              <X className="mr-1 h-3 w-3" />
                              Desmarcar Todos
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-blue-50">
                      {season.episodes.map((episode, episodeIndex) => (
                        <div
                          key={episode.number}
                          className={`flex items-center gap-3 p-3 ${episode.watched ? "bg-blue-50/50" : ""}`}
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                            {episode.number}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-blue-900">{episode.title}</div>
                            {episode.titlePt && <div className="text-sm text-blue-600">{episode.titlePt}</div>}
                            <div className="mt-1 text-xs text-blue-500">{episode.filename}</div>
                          </div>

                          <div className="flex items-center gap-1 text-sm text-blue-600">
                            <Clock className="h-4 w-4" />
                            <span>{episode.duration} min</span>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                              onClick={() => toggleEpisodeWatched(seasonIndex, episodeIndex)}
                            >
                              <Check className={`h-4 w-4 ${episode.watched ? "text-green-600" : ""}`} />
                              <span className="sr-only">
                                Marcar como {episode.watched ? "não assistido" : "assistido"}
                              </span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                              onClick={() => playEpisode(episode)}
                            >
                              <Play className="h-4 w-4" />
                              <span className="sr-only">Reproduzir</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                              onClick={() => showEpisodeInfo(episode)}
                            >
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Informações</span>
                            </Button>
                          </div>
                        </div>
                      ))}

                      {season.availableEpisodes < season.totalEpisodes && (
                        <div className="p-3">
                          <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-3 text-center text-sm text-blue-600">
                            {season.totalEpisodes - season.availableEpisodes} episódio(s) faltando
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <div className="rounded-lg border border-blue-100 bg-white p-4">
                <h3 className="mb-3 font-medium text-blue-900">Detalhes da Série</h3>

                {series.synopsis ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-blue-800">Sinopse</h4>
                    <p className="mt-1 text-sm text-blue-700">{series.synopsis}</p>
                  </div>
                ) : (
                  <p className="text-blue-700">
                    Informações detalhadas não disponíveis. Clique no botão "Atualizar do TMDb" para buscar mais
                    detalhes.
                  </p>
                )}

                {series.cast && series.cast.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-blue-800">Elenco Principal</h4>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {series.cast.map((actor, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{actor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-center">
                  <Button onClick={updateSeriesFromImdb} disabled={isLoadingImdb}>
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
          </Tabs>
        </div>
      </div>

      <Dialog open={episodeDialogOpen} onOpenChange={setEpisodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Informações do Episódio</DialogTitle>
            <DialogDescription>Informações detalhadas sobre este episódio</DialogDescription>
          </DialogHeader>

          {episodeInfo && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-blue-900">{episodeInfo.title}</h3>
                {episodeInfo.titlePt && <p className="text-blue-600">{episodeInfo.titlePt}</p>}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-600">Duração:</span>
                  <span>{episodeInfo.duration} minutos</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-blue-600">Data de Lançamento:</span>
                  <span>{episodeInfo.releaseDate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-blue-600">Avaliação IMDb:</span>
                  <span>{episodeInfo.imdbRating}/10</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-blue-600">Status:</span>
                  <Badge variant={episodeInfo.watched ? "success" : "outline"}>
                    {episodeInfo.watched ? "Assistido" : "Não Assistido"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="mb-1 text-sm font-medium text-blue-900">Sinopse</h4>
                <p className="text-sm text-blue-700">{episodeInfo.synopsis}</p>
              </div>

              <div>
                <h4 className="mb-1 text-sm font-medium text-blue-900">Informações do Arquivo</h4>
                <div className="rounded-md bg-blue-50 p-2 text-xs font-mono text-blue-800">{episodeInfo.filename}</div>
              </div>

              {episodeInfo.cast && episodeInfo.cast.length > 0 && (
                <div>
                  <h4 className="mb-1 text-sm font-medium text-blue-900">Elenco</h4>
                  <div className="flex flex-wrap gap-1">
                    {episodeInfo.cast.map((actor, index) => (
                      <Badge key={index} variant="outline">
                        {actor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Série</DialogTitle>
            <DialogDescription>Atualize as informações da série</DialogDescription>
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
              <Label htmlFor="genres">Gêneros (separados por vírgula)</Label>
              <Input id="genres" name="genres" value={editFormData.genres} onChange={handleEditInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="creator">Criador</Label>
              <Input id="creator" name="creator" value={editFormData.creator} onChange={handleEditInputChange} />
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
            <Button onClick={saveSeriesEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


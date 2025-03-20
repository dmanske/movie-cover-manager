"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, EyeOff, Grid, List, HardDrive, Filter, Edit, Search, Play, Check, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { AddShow } from "@/components/add-show"
import type { HD, Show } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function ShowsLibrary() {
  const { toast } = useToast()
  const [shows, setShows] = useState<Show[]>([])
  const [hds, setHds] = useState<HD[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showHidden, setShowHidden] = useState(false)
  const [hdFilter, setHdFilter] = useState<string | null>(null)
  const [watchedFilter, setWatchedFilter] = useState<"all" | "watched" | "unwatched">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [genreFilter, setGenreFilter] = useState<string | null>(null)
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  useEffect(() => {
    // Load data from localStorage
    const storedShows = localStorage.getItem("shows")
    const storedHds = localStorage.getItem("hds")

    if (storedShows) {
      const parsedShows = JSON.parse(storedShows)
      setShows(parsedShows)

      // Extract all unique genres
      const genres = new Set<string>()
      parsedShows.forEach((s: Show) => {
        if (s.genres && s.genres.length > 0) {
          s.genres.forEach((genre) => genres.add(genre))
        }
      })
      setAvailableGenres(Array.from(genres).sort())
    } else {
      // Initialize with sample data if none exists
      const initialShows: Show[] = [
        {
          id: "1",
          title: "Rock in Rio 2022",
          hdId: "1",
          hidden: false,
          imdbId: "show-001",
          poster: "/placeholder.svg?height=450&width=300",
          year: 2022,
          duration: 180,
          watched: true,
          synopsis: "Festival de música realizado no Rio de Janeiro em 2022.",
          genres: ["Música", "Festival"],
          director: "Diversos",
          performers: ["Coldplay", "Guns N' Roses", "Iron Maiden"],
          venue: "Cidade do Rock, Rio de Janeiro",
          filename: "Rock.in.Rio.2022.1080p.mp4",
        },
        {
          id: "2",
          title: "Cirque du Soleil - Alegría",
          hdId: "2",
          hidden: false,
          imdbId: "show-002",
          poster: "/placeholder.svg?height=450&width=300",
          year: 2019,
          duration: 120,
          watched: false,
          synopsis:
            "Um dos espetáculos mais emblemáticos do Cirque du Soleil, celebrando a juventude, energia e poder.",
          genres: ["Circo", "Performance"],
          director: "Franco Dragone",
          performers: ["Cirque du Soleil"],
          venue: "Big Top, Montreal",
          filename: "Cirque.du.Soleil.Alegria.2019.1080p.mp4",
        },
        {
          id: "3",
          title: "Broadway - Hamilton",
          hdId: "3",
          hidden: true,
          imdbId: "show-003",
          poster: "/placeholder.svg?height=450&width=300",
          year: 2020,
          duration: 160,
          watched: true,
          synopsis: "Musical que conta a história de Alexander Hamilton, um dos pais fundadores dos Estados Unidos.",
          genres: ["Musical", "Teatro"],
          director: "Thomas Kail",
          performers: ["Lin-Manuel Miranda", "Leslie Odom Jr.", "Phillipa Soo"],
          venue: "Richard Rodgers Theatre, New York",
          filename: "Hamilton.2020.1080p.mp4",
        },
      ]
      setShows(initialShows)
      localStorage.setItem("shows", JSON.stringify(initialShows))
    }

    if (storedHds) {
      setHds(JSON.parse(storedHds))
    }
  }, [])

  const toggleShowVisibility = (id: string) => {
    const updatedShows = shows.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s))

    setShows(updatedShows)
    localStorage.setItem("shows", JSON.stringify(updatedShows))

    toast({
      title: "Show Atualizado",
      description: `A visibilidade do show foi alterada.`,
    })
  }

  const toggleShowWatched = (id: string) => {
    const updatedShows = shows.map((s) => (s.id === id ? { ...s, watched: !s.watched } : s))

    setShows(updatedShows)
    localStorage.setItem("shows", JSON.stringify(updatedShows))

    toast({
      title: "Show Atualizado",
      description: `O show foi marcado como ${updatedShows.find((s) => s.id === id)?.watched ? "assistido" : "não assistido"}.`,
    })
  }

  const deleteShow = (id: string) => {
    if (confirm("Tem certeza que deseja remover este show?")) {
      const updatedShows = shows.filter((s) => s.id !== id)

      setShows(updatedShows)
      localStorage.setItem("shows", JSON.stringify(updatedShows))

      toast({
        title: "Show Removido",
        description: "O show foi removido com sucesso.",
        variant: "destructive",
      })
    }
  }

  const playShow = (show: Show) => {
    // In a real application, this would launch the system's default video player
    // For this demo, we'll just show a toast
    toast({
      title: "Reproduzindo Show",
      description: `Reproduzindo: ${show.title}`,
    })
  }

  const filteredShows = shows.filter((s) => {
    // Filter by visibility
    if (!showHidden && s.hidden) return false

    // Filter by search query
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false

    // Filter by HD
    if (hdFilter === "connected") {
      const hd = hds.find((h) => h.id === s.hdId)
      if (!hd?.connected) return false
    } else if (hdFilter === "disconnected") {
      const hd = hds.find((h) => h.id === s.hdId)
      if (hd?.connected) return false
    } else if (hdFilter && hdFilter !== "all" && s.hdId !== hdFilter) {
      return false
    }

    // Filter by genre
    if (genreFilter && (!s.genres || !s.genres.includes(genreFilter))) return false

    // Filter by watched status
    if (watchedFilter === "watched" && !s.watched) return false
    if (watchedFilter === "unwatched" && s.watched) return false

    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Biblioteca de Shows</h1>
          <p className="text-blue-700">Gerencie sua coleção de shows, concertos e performances</p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
          <Input
            type="search"
            placeholder="Buscar shows..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AddShow />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHidden(!showHidden)}
          className={showHidden ? "bg-blue-100" : ""}
        >
          {showHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
          {showHidden ? "Mostrar Todos" : "Ocultos: Off"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <HardDrive className="mr-2 h-4 w-4" />
              Filtrar por HD
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrar por HD</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={hdFilter === "all" || hdFilter === null}
              onCheckedChange={() => setHdFilter("all")}
            >
              Todos os HDs
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={hdFilter === "connected"}
              onCheckedChange={() => setHdFilter("connected")}
            >
              Apenas Conectados
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={hdFilter === "disconnected"}
              onCheckedChange={() => setHdFilter("disconnected")}
            >
              Apenas Desconectados
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            {hds.map((hd) => (
              <DropdownMenuCheckboxItem
                key={hd.id}
                checked={hdFilter === hd.id}
                onCheckedChange={() => setHdFilter(hd.id)}
              >
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: hd.color }} />
                  {hd.name}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {availableGenres.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Gênero
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por Gênero</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={genreFilter === null} onCheckedChange={() => setGenreFilter(null)}>
                Todos os Gêneros
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {availableGenres.map((genre) => (
                <DropdownMenuCheckboxItem
                  key={genre}
                  checked={genreFilter === genre}
                  onCheckedChange={() => setGenreFilter(genre)}
                >
                  {genre}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={watchedFilter === "all"} onCheckedChange={() => setWatchedFilter("all")}>
              Todos os Shows
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={watchedFilter === "watched"}
              onCheckedChange={() => setWatchedFilter("watched")}
            >
              Assistidos
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={watchedFilter === "unwatched"}
              onCheckedChange={() => setWatchedFilter("unwatched")}
            >
              Não Assistidos
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex rounded-md border border-input">
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-none rounded-l-md ${viewMode === "grid" ? "bg-blue-100" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
            <span className="sr-only">Visualização em grade</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-none rounded-r-md ${viewMode === "list" ? "bg-blue-100" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Visualização em lista</span>
          </Button>
        </div>
      </div>

      {filteredShows.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
          <p className="text-blue-700">Nenhum show encontrado com os filtros atuais.</p>
          <Button
            variant="link"
            onClick={() => {
              setHdFilter(null)
              setWatchedFilter("all")
              setShowHidden(false)
              setGenreFilter(null)
              setSearchQuery("")
            }}
          >
            Limpar todos os filtros
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredShows.map((show) => {
            const hd = hds.find((h) => h.id === show.hdId)

            return (
              <Card key={show.id} className="overflow-hidden">
                <div className="relative">
                  <Link href={`/shows/${show.id}`}>
                    <img
                      src={show.poster || "/placeholder.svg?height=450&width=300"}
                      alt={show.title}
                      className="aspect-[2/3] w-full object-cover"
                    />
                  </Link>

                  <div className="absolute right-2 top-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                      onClick={() => toggleShowVisibility(show.id)}
                    >
                      {show.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      <span className="sr-only">{show.hidden ? "Mostrar show" : "Ocultar show"}</span>
                    </Button>
                  </div>

                  <div className="absolute left-2 top-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar capa</span>
                    </Button>
                  </div>

                  {show.watched && (
                    <div className="absolute bottom-2 right-2">
                      <Badge className="bg-green-500 text-white">Assistido</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <Link href={`/shows/${show.id}`} className="line-clamp-1 font-medium text-blue-900 hover:underline">
                      {show.title}
                    </Link>
                    <span className="text-sm text-blue-600">{show.year}</span>
                  </div>

                  {show.genres && show.genres.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {show.genres.slice(0, 2).map((genre) => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                      {show.genres.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{show.genres.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: hd?.color || "#3B82F6" }} />
                    <span>{hd?.name || "HD Desconhecido"}</span>
                    <span className="ml-1">({hd?.connected ? "Conectado" : "Desconectado"})</span>
                  </div>

                  <div className="mt-2 flex justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-blue-700 hover:bg-blue-50"
                      onClick={() => toggleShowWatched(show.id)}
                    >
                      <Check className={`mr-1 h-4 w-4 ${show.watched ? "text-green-600" : ""}`} />
                      {show.watched ? "Assistido" : "Marcar"}
                    </Button>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                        onClick={() => playShow(show)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-700 hover:bg-red-50"
                        onClick={() => deleteShow(show.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredShows.map((show) => {
            const hd = hds.find((h) => h.id === show.hdId)

            return (
              <div key={show.id} className="flex items-center gap-4 rounded-lg border border-blue-100 bg-white p-3">
                <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded">
                  <img
                    src={show.poster || "/placeholder.svg"}
                    alt={show.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/shows/${show.id}`} className="font-medium text-blue-900 hover:underline">
                      {show.title}
                    </Link>
                    <span className="text-sm text-blue-600">({show.year})</span>
                    {show.watched && (
                      <Badge variant="success" className="ml-2">
                        Assistido
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: hd?.color || "#3B82F6" }} />
                      <span>{hd?.name || "HD Desconhecido"}</span>
                      <Badge variant={hd?.connected ? "outline" : "secondary"} className="text-[10px]">
                        {hd?.connected ? "Conectado" : "Desconectado"}
                      </Badge>
                    </div>

                    {show.duration && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <span>{show.duration} min</span>
                      </div>
                    )}
                  </div>

                  {show.genres && show.genres.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {show.genres.map((genre) => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                    onClick={() => toggleShowWatched(show.id)}
                  >
                    <Check className={`h-4 w-4 ${show.watched ? "text-green-600" : ""}`} />
                    <span className="sr-only">
                      {show.watched ? "Marcar como não assistido" : "Marcar como assistido"}
                    </span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                    onClick={() => toggleShowVisibility(show.id)}
                  >
                    {show.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="sr-only">{show.hidden ? "Mostrar show" : "Ocultar show"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                    onClick={() => playShow(show)}
                  >
                    <Play className="h-4 w-4" />
                    <span className="sr-only">Reproduzir</span>
                  </Button>

                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-700 hover:bg-blue-50">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar show</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-700 hover:bg-red-50"
                    onClick={() => deleteShow(show.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remover show</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, EyeOff, Grid, List, HardDrive, Filter, Edit, Search, Play, Check, Trash2, ScanLine, FolderOpen, RefreshCw } from "lucide-react"
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
import { AddMovie } from "@/components/add-movie"
import { FileBrowser } from "@/components/file-browser"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { HD, Movie } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function MoviesLibrary() {
  const { toast } = useToast()
  const [movies, setMovies] = useState<Movie[]>([])
  const [hds, setHds] = useState<HD[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showHidden, setShowHidden] = useState(false)
  const [hdFilter, setHdFilter] = useState<string | null>(null)
  const [watchedFilter, setWatchedFilter] = useState<"all" | "watched" | "unwatched">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [genreFilter, setGenreFilter] = useState<string | null>(null)
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  
  // Estado para escanear filmes
  const [isScanning, setIsScanning] = useState(false)
  const [selectedHdForScan, setSelectedHdForScan] = useState<string | null>(null)
  const [scanMode, setScanMode] = useState<"full" | "directory">("full")
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null)
  const [scanDialogOpen, setScanDialogOpen] = useState(false)

  useEffect(() => {
    // Verificar se estamos no navegador antes de acessar localStorage
    if (typeof window !== 'undefined') {
      // Load data from localStorage
      const storedMovies = localStorage.getItem("movies")
      const storedHds = localStorage.getItem("hds")

      if (storedMovies) {
        const parsedMovies = JSON.parse(storedMovies)
        setMovies(parsedMovies)

        // Extract all unique genres
        const genres = new Set<string>()
        parsedMovies.forEach((m: Movie) => {
          if (m.genres && m.genres.length > 0) {
            m.genres.forEach((genre) => genres.add(genre))
          }
        })
        setAvailableGenres(Array.from(genres).sort())
      }

      if (storedHds) {
        setHds(JSON.parse(storedHds))
      }

      const storedApiKey = localStorage.getItem("imdbApiKey")
      if (storedApiKey) {
        setApiKey(storedApiKey)
      }
    }
  }, [])

  const toggleMovieVisibility = (id: string) => {
    if (typeof window === 'undefined') return;
    
    const updatedMovies = movies.map((m) => (m.id === id ? { ...m, hidden: !m.hidden } : m))

    setMovies(updatedMovies)
    localStorage.setItem("movies", JSON.stringify(updatedMovies))

    toast({
      title: "Filme Atualizado",
      description: `A visibilidade do filme foi alterada.`,
    })
  }

  const toggleMovieWatched = (id: string) => {
    const updatedMovies = movies.map((m) => (m.id === id ? { ...m, watched: !m.watched } : m))

    setMovies(updatedMovies)
    localStorage.setItem("movies", JSON.stringify(updatedMovies))

    toast({
      title: "Filme Atualizado",
      description: `O filme foi marcado como ${updatedMovies.find((m) => m.id === id)?.watched ? "assistido" : "não assistido"}.`,
    })
  }

  const deleteMovie = (id: string) => {
    if (confirm("Tem certeza que deseja remover este filme?")) {
      const updatedMovies = movies.filter((m) => m.id !== id)

      setMovies(updatedMovies)
      localStorage.setItem("movies", JSON.stringify(updatedMovies))

      toast({
        title: "Filme Removido",
        description: "O filme foi removido com sucesso.",
        variant: "destructive",
      })
    }
  }

  const playMovie = (movie: Movie) => {
    // In a real application, this would launch the system's default video player
    // For this demo, we'll just show a toast
    toast({
      title: "Reproduzindo Filme",
      description: `Reproduzindo: ${movie.title}`,
    })
  }

  const filteredMovies = movies.filter((m) => {
    // Filter by visibility
    if (!showHidden && m.hidden) return false

    // Filter by search query
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false

    // Filter by HD
    if (hdFilter === "connected") {
      const hd = hds.find((h) => h.id === m.hdId)
      if (!hd?.connected) return false
    } else if (hdFilter === "disconnected") {
      const hd = hds.find((h) => h.id === m.hdId)
      if (hd?.connected) return false
    } else if (hdFilter && hdFilter !== "all" && m.hdId !== hdFilter) {
      return false
    }

    // Filter by genre
    if (genreFilter && (!m.genres || !m.genres.includes(genreFilter))) return false

    // Filter by watched status
    if (watchedFilter === "watched" && !m.watched) return false
    if (watchedFilter === "unwatched" && m.watched) return false

    return true
  })

  // Função para escanear por filmes
  const scanForMovies = async () => {
    if (!selectedHdForScan) {
      toast({
        title: "Erro",
        description: "Selecione um HD para escanear",
        variant: "destructive",
      })
      return
    }

    setIsScanning(true)
    
    // Encontrar o HD selecionado
    const selectedHd = hds.find(hd => hd.id === selectedHdForScan)
    
    // Local para escanear (HD completo ou diretório específico)
    const scanLocation = scanMode === "full" ? selectedHd?.path : selectedDirectory
    
    if (!scanLocation) {
      toast({
        title: "Erro",
        description: "Caminho inválido para escaneamento",
        variant: "destructive",
      })
      setIsScanning(false)
      return
    }
    
    try {
      toast({
        title: "Escaneamento iniciado",
        description: `Escaneando ${scanMode === "full" ? "todo o HD" : "diretório selecionado"}...`,
      })
      
      // Simular um escaneamento (em um aplicativo real, isso seria feito via Electron)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Em um aplicativo real, aqui seria feita a varredura de diretórios
      // e identificação de filmes baseado nos nomes de arquivo
      
      // Simular a descoberta de novos filmes
      const newMovie: Movie = {
        id: `new-${Date.now()}`,
        title: "Novo Filme Encontrado",
        hdId: selectedHdForScan,
        hidden: false,
        imdbId: "tt0000000",
        poster: "/placeholder.svg?height=450&width=300",
        year: 2023,
        duration: 120,
        watched: false,
        synopsis: "Um novo filme encontrado no escaneamento.",
        genres: ["Ação", "Aventura"],
        director: "Diretor do Filme",
        imdbRating: 7.5,
        releaseDate: "2023-01-01",
        filename: "Novo.Filme.2023.1080p.BluRay.mkv",
      }
      
      // Adicionar o novo filme ao estado e ao localStorage
      const updatedMovies = [...movies, newMovie]
      setMovies(updatedMovies)
      localStorage.setItem("movies", JSON.stringify(updatedMovies))
      
      // Fechar o diálogo e mostrar mensagem de sucesso
      setScanDialogOpen(false)
      
      toast({
        title: "Escaneamento concluído",
        description: "Novos filmes foram adicionados à sua biblioteca.",
      })
    } catch (error) {
      console.error("Erro ao escanear por filmes:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao escanear por filmes",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Biblioteca de Filmes</h1>
          <p className="text-blue-700">Gerencie sua coleção de filmes</p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
          <Input
            type="search"
            placeholder="Buscar filmes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AddMovie />
        
        {/* Botão para abrir o diálogo de escaneamento */}
        <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              <ScanLine className="mr-2 h-4 w-4" />
              Escanear HD
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Escanear HD por Filmes</DialogTitle>
              <DialogDescription>
                Selecione um HD e escolha se deseja escanear o HD completo ou um diretório específico.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="hd-select">Selecione o HD</Label>
                <select 
                  id="hd-select"
                  className="w-full rounded-md border border-blue-200 p-2"
                  value={selectedHdForScan || ""}
                  onChange={(e) => setSelectedHdForScan(e.target.value)}
                >
                  <option value="">Selecione um HD</option>
                  {hds.filter(hd => hd.connected).map(hd => (
                    <option key={hd.id} value={hd.id}>{hd.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Modo de escaneamento</Label>
                <RadioGroup 
                  value={scanMode} 
                  onValueChange={(value) => setScanMode(value as "full" | "directory")}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="scan-full" />
                    <Label htmlFor="scan-full">HD Completo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="directory" id="scan-directory" />
                    <Label htmlFor="scan-directory">Diretório Específico</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {scanMode === "directory" && selectedHdForScan && (
                <div className="space-y-2 border rounded-md p-3">
                  <Label>Selecione o diretório</Label>
                  <div className="h-[200px] overflow-hidden rounded border">
                    <FileBrowser 
                      hdId={selectedHdForScan}
                      onFileSelect={(path) => setSelectedDirectory(path)}
                      showFiles={false}
                    />
                  </div>
                  {selectedDirectory && (
                    <div className="flex items-center text-sm text-blue-600 mt-2">
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Diretório selecionado: <span className="font-mono ml-1 truncate">{selectedDirectory}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setScanDialogOpen(false)}
                disabled={isScanning}
              >
                Cancelar
              </Button>
              <Button 
                onClick={scanForMovies} 
                disabled={isScanning || !selectedHdForScan || (scanMode === "directory" && !selectedDirectory)}
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Escaneando...
                  </>
                ) : (
                  <>
                    <ScanLine className="mr-2 h-4 w-4" />
                    Iniciar Escaneamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              Todos os Filmes
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

      {filteredMovies.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
          <p className="text-blue-700">Nenhum filme encontrado com os filtros atuais.</p>
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
          {filteredMovies.map((movie) => {
            const hd = hds.find((h) => h.id === movie.hdId)

            return (
              <Card key={movie.id} className="overflow-hidden">
                <div className="relative">
                  <Link href={`/movies/${movie.id}`}>
                    <img
                      src={movie.poster || "/placeholder.svg?height=450&width=300"}
                      alt={movie.title}
                      className="aspect-[2/3] w-full object-cover"
                    />
                  </Link>

                  <div className="absolute right-2 top-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                      onClick={() => toggleMovieVisibility(movie.id)}
                    >
                      {movie.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      <span className="sr-only">{movie.hidden ? "Mostrar filme" : "Ocultar filme"}</span>
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

                  {movie.watched && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-green-500 text-white">Assistido</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/movies/${movie.id}`}
                      className="line-clamp-1 font-medium text-blue-900 hover:underline"
                    >
                      {movie.title}
                    </Link>
                    <span className="text-sm text-blue-600">{movie.year}</span>
                  </div>

                  {movie.genres && movie.genres.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {movie.genres.slice(0, 2).map((genre) => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                      {movie.genres.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{movie.genres.length - 2}
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
                      onClick={() => toggleMovieWatched(movie.id)}
                    >
                      <Check className={`mr-1 h-4 w-4 ${movie.watched ? "text-green-600" : ""}`} />
                      {movie.watched ? "Assistido" : "Marcar"}
                    </Button>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                        onClick={() => playMovie(movie)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-700 hover:bg-red-50"
                        onClick={() => deleteMovie(movie.id)}
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
          {filteredMovies.map((movie) => {
            const hd = hds.find((h) => h.id === movie.hdId)

            return (
              <div key={movie.id} className="flex items-center gap-4 rounded-lg border border-blue-100 bg-white p-3">
                <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded">
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/movies/${movie.id}`} className="font-medium text-blue-900 hover:underline">
                      {movie.title}
                    </Link>
                    <span className="text-sm text-blue-600">({movie.year})</span>
                    {movie.watched && (
                      <Badge variant="secondary" className="ml-2">
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

                    {movie.duration && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <span>{movie.duration} min</span>
                      </div>
                    )}
                  </div>

                  {movie.genres && movie.genres.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {movie.genres.map((genre) => (
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
                    onClick={() => toggleMovieWatched(movie.id)}
                  >
                    <Check className={`h-4 w-4 ${movie.watched ? "text-green-600" : ""}`} />
                    <span className="sr-only">
                      {movie.watched ? "Marcar como não assistido" : "Marcar como assistido"}
                    </span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                    onClick={() => toggleMovieVisibility(movie.id)}
                  >
                    {movie.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="sr-only">{movie.hidden ? "Mostrar filme" : "Ocultar filme"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                    onClick={() => playMovie(movie)}
                  >
                    <Play className="h-4 w-4" />
                    <span className="sr-only">Reproduzir</span>
                  </Button>

                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-700 hover:bg-blue-50">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar filme</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-700 hover:bg-red-50"
                    onClick={() => deleteMovie(movie.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remover filme</span>
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


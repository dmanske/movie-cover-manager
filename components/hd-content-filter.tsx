"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FolderOpen, Filter, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { HD, Movie, Series } from "@/lib/types"

interface HDContentFilterProps {
  hdId: string
}

export function HDContentFilter({ hdId }: HDContentFilterProps) {
  const router = useRouter()
  const [hd, setHd] = useState<HD | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([])
  const [showMovies, setShowMovies] = useState(true)
  const [showSeries, setShowSeries] = useState(true)
  const [showHidden, setShowHidden] = useState(false)

  // Load data from localStorage
  useEffect(() => {
    const storedHds = localStorage.getItem("hds")
    const storedMovies = localStorage.getItem("movies")
    const storedSeries = localStorage.getItem("series")

    if (storedHds) {
      const allHds = JSON.parse(storedHds)
      const foundHd = allHds.find((h: HD) => h.id === hdId)
      setHd(foundHd || null)
    }

    if (storedMovies) {
      const allMovies = JSON.parse(storedMovies)
      const hdMovies = allMovies.filter((m: Movie) => m.hdId === hdId)
      setMovies(hdMovies)
    }

    if (storedSeries) {
      const allSeries = JSON.parse(storedSeries)
      const hdSeries = allSeries.filter((s: Series) => s.hdId === hdId)
      setSeries(hdSeries)
    }
  }, [hdId])

  // Apply filters
  useEffect(() => {
    let filteredM = [...movies]
    let filteredS = [...series]

    // Apply hidden filter
    if (!showHidden) {
      filteredM = filteredM.filter((m) => !m.hidden)
      filteredS = filteredS.filter((s) => !s.hidden)
    }

    setFilteredMovies(filteredM)
    setFilteredSeries(filteredS)
  }, [movies, series, showHidden])

  if (!hd) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
        <p className="text-blue-700">HD não encontrado.</p>
        <Button variant="link" onClick={() => router.push("/hds")}>
          Voltar para Gerenciamento de HDs
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">
            Conteúdo em {hd.name}
            {!hd.connected && <span className="ml-2 text-sm font-normal text-red-600">(Desconectado)</span>}
          </h1>
          <p className="text-blue-700">{hd.path}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar Conteúdo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Tipo de Conteúdo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={showMovies} onCheckedChange={setShowMovies}>
                Mostrar Filmes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={showSeries} onCheckedChange={setShowSeries}>
                Mostrar Séries
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={showHidden} onCheckedChange={setShowHidden}>
                Mostrar Itens Ocultos
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={() => router.push("/hds")}>
            Voltar para HDs
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {showMovies && filteredMovies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                Filmes ({filteredMovies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center gap-2 rounded-md border border-blue-100 p-2 hover:bg-blue-50"
                    onClick={() => router.push(`/movies/${movie.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="h-10 w-7 flex-shrink-0 overflow-hidden rounded">
                      <img
                        src={movie.poster || "/placeholder.svg"}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-blue-900">{movie.title}</div>
                      <div className="text-xs text-blue-600">{movie.year}</div>
                    </div>
                    {movie.watched && <Check className="h-4 w-4 text-green-600" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showSeries && filteredSeries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                Séries ({filteredSeries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredSeries.map((series) => (
                  <div
                    key={series.id}
                    className="flex items-center gap-2 rounded-md border border-blue-100 p-2 hover:bg-blue-50"
                    onClick={() => router.push(`/series/${series.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="h-10 w-7 flex-shrink-0 overflow-hidden rounded">
                      <img
                        src={series.poster || "/placeholder.svg"}
                        alt={series.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-blue-900">{series.title}</div>
                      <div className="text-xs text-blue-600">{series.seasons.length} temporada(s)</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(!showMovies || filteredMovies.length === 0) && (!showSeries || filteredSeries.length === 0) && (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
            <p className="text-blue-700">Nenhum conteúdo encontrado com os filtros atuais.</p>
            <Button
              variant="link"
              onClick={() => {
                setShowMovies(true)
                setShowSeries(true)
                setShowHidden(true)
              }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


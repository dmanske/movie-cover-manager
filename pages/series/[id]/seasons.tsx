"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import { ArrowLeft, Calendar, CheckCircle, Film, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Series } from "@/lib/types"

export default function SeriesSeasons() {
  const router = useRouter()
  const { id } = router.query
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)

  // Carregar dados da série
  useEffect(() => {
    if (!id) return

    const loadSeries = () => {
      setLoading(true)
      try {
        const storedSeries = localStorage.getItem("series")
        if (storedSeries) {
          const allSeries = JSON.parse(storedSeries)
          const foundSeries = allSeries.find((s: Series) => s.id === id)
          if (foundSeries) {
            setSeries(foundSeries)
          }
        }
      } catch (error) {
        console.error("Erro ao carregar série:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSeries()
  }, [id])

  // Calcular progresso de episódios assistidos por temporada
  const calculateSeasonProgress = (seasonNumber: number) => {
    if (!series) return 0
    
    const season = series.seasons.find(s => s.number === seasonNumber)
    if (!season) return 0
    
    const watchedCount = season.episodes.filter(ep => ep.watched).length
    return (watchedCount / season.episodes.length) * 100
  }

  // Navegar para a página de episódios
  const viewSeasonEpisodes = (seasonNumber: number) => {
    router.push(`/series/${id}/seasons/${seasonNumber}/episodes`)
  }

  // Voltar para a página da biblioteca
  const backToLibrary = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (!series) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Série não encontrada</h1>
          <Button onClick={backToLibrary}>Voltar para Biblioteca</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Button variant="ghost" onClick={backToLibrary} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Biblioteca
      </Button>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative w-full md:w-1/4 aspect-[2/3] rounded-lg overflow-hidden shadow-md">
            <Image
              src={series.posterUrl || series.poster || "/placeholder-poster.jpg"}
              alt={series.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 25vw"
              priority
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{series.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {series.year && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {series.year}
                </Badge>
              )}
              {series.imdbId && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-400" />
                  IMDB: {series.imdbId}
                </Badge>
              )}
              {series.watched && (
                <Badge className="bg-green-500 text-white">Assistido</Badge>
              )}
            </div>
            {series.synopsis && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-1">Sinopse</h2>
                <p className="text-gray-700">{series.synopsis}</p>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold mb-2">Temporadas</h2>
              <p className="text-gray-700">
                {series.seasons.length} temporada{series.seasons.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Temporadas</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {series.seasons
          .sort((a, b) => a.number - b.number)
          .map((season) => (
            <Card 
              key={season.number} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => viewSeasonEpisodes(season.number)}
            >
              <div className="aspect-video relative bg-blue-50">
                {season.poster ? (
                  <Image
                    src={season.poster}
                    alt={`Temporada ${season.number}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film className="h-12 w-12 text-blue-200" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle>Temporada {season.number}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm text-gray-500">
                  {season.availableEpisodes} episódio{season.availableEpisodes !== 1 ? "s" : ""}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progresso</span>
                    <span>
                      {Math.round(calculateSeasonProgress(season.number))}%
                    </span>
                  </div>
                  <Progress value={calculateSeasonProgress(season.number)} />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full text-blue-600">
                  Ver Episódios
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  )
} 
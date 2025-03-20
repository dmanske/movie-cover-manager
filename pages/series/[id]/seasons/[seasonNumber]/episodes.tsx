"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import { ArrowLeft, Calendar, CheckCircle, Clock, Film, PlayCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Series, Season, Episode } from "@/lib/types"
import { electronAPI, isElectron } from "@/lib/electron-bridge"

export default function SeasonEpisodes() {
  const router = useRouter()
  const { id, seasonNumber } = router.query
  const [series, setSeries] = useState<Series | null>(null)
  const [season, setSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Carregar dados da série e temporada
  useEffect(() => {
    if (!id || !seasonNumber) return

    const loadSeries = () => {
      setLoading(true)
      try {
        const storedSeries = localStorage.getItem("series")
        if (storedSeries) {
          const allSeries = JSON.parse(storedSeries)
          const foundSeries = allSeries.find((s: Series) => s.id === id)
          
          if (foundSeries) {
            setSeries(foundSeries)
            
            // Encontrar a temporada específica
            const seasonNum = parseInt(seasonNumber as string, 10)
            const foundSeason = foundSeries.seasons.find((s: Season) => s.number === seasonNum)
            
            if (foundSeason) {
              setSeason(foundSeason)
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar série:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSeries()
  }, [id, seasonNumber])

  // Marcar episódio como assistido/não assistido
  const toggleEpisodeWatched = (episodeNumber: number) => {
    if (!series || !season) return

    // Criar cópia profunda da série
    const updatedSeries = JSON.parse(JSON.stringify(series))
    
    // Encontrar a temporada
    const seasonIndex = updatedSeries.seasons.findIndex((s: Season) => s.number === season.number)
    if (seasonIndex === -1) return
    
    // Encontrar o episódio
    const episodeIndex = updatedSeries.seasons[seasonIndex].episodes.findIndex(
      (e: Episode) => e.number === episodeNumber
    )
    if (episodeIndex === -1) return
    
    // Inverter status
    updatedSeries.seasons[seasonIndex].episodes[episodeIndex].watched = 
      !updatedSeries.seasons[seasonIndex].episodes[episodeIndex].watched
    
    // Atualizar série
    setSeries(updatedSeries)
    setSeason(updatedSeries.seasons[seasonIndex])
    
    // Salvar no localStorage
    const storedSeries = localStorage.getItem("series")
    if (storedSeries) {
      const allSeries = JSON.parse(storedSeries)
      const seriesIndex = allSeries.findIndex((s: Series) => s.id === id)
      
      if (seriesIndex !== -1) {
        allSeries[seriesIndex] = updatedSeries
        localStorage.setItem("series", JSON.stringify(allSeries))
        
        toast({
          title: "Status atualizado",
          description: "Status do episódio atualizado com sucesso.",
        })
      }
    }
  }

  // Reproduzir episódio
  const playEpisode = async (episode: Episode) => {
    if (!episode.path) {
      toast({
        title: "Caminho não disponível",
        description: "O caminho do arquivo não está disponível.",
        variant: "destructive",
      })
      return
    }

    if (isElectron) {
      try {
        const success = await electronAPI.openFile(episode.path)
        if (!success) {
          toast({
            title: "Erro",
            description: "Não foi possível reproduzir o episódio",
            variant: "destructive",
          })
        } else {
          // Marcar como assistido após iniciar a reprodução
          toggleEpisodeWatched(episode.number)
        }
      } catch (error) {
        console.error("Erro ao reproduzir episódio:", error)
        toast({
          title: "Erro",
          description: "Não foi possível reproduzir o episódio",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Não suportado",
        description: "A reprodução só está disponível no aplicativo desktop",
      })
    }
  }

  // Voltar para a página de temporadas
  const backToSeasons = () => {
    router.push(`/series/${id}/seasons`)
  }

  // Formatar duração
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (!series || !season) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Série ou temporada não encontrada</h1>
          <Button onClick={() => router.push('/')}>Voltar para Biblioteca</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Biblioteca
        </Button>
        <span className="text-gray-500 mx-2">›</span>
        <Button variant="ghost" onClick={backToSeasons} className="mb-2">
          <Film className="mr-2 h-4 w-4" />
          {series.title}
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative w-full md:w-1/4 aspect-video rounded-lg overflow-hidden shadow-md">
            {season.poster ? (
              <Image
                src={season.poster}
                alt={`Temporada ${season.number}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 25vw"
                priority
              />
            ) : (
              <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                <Film className="h-16 w-16 text-blue-200" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {series.title}: Temporada {season.number}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {series.year}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                {season.availableEpisodes} episódio{season.availableEpisodes !== 1 ? "s" : ""}
              </Badge>
            </div>
            
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-4">Episódios</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {season.episodes
          .sort((a, b) => a.number - b.number)
          .map((episode) => (
            <Card key={episode.number} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div 
                  className="relative w-full md:w-48 aspect-video bg-blue-50 cursor-pointer"
                  onClick={() => playEpisode(episode)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-blue-400 hover:text-blue-600 transition-colors" />
                  </div>
                </div>
                
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">
                        {episode.number}. {episode.title}
                      </h3>
                      {episode.duration > 0 && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(episode.duration)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-full ${episode.watched ? 'bg-green-100' : ''}`}
                        onClick={() => toggleEpisodeWatched(episode.number)}
                      >
                        <CheckCircle className={`h-5 w-5 ${episode.watched ? 'text-green-500' : 'text-gray-300'}`} />
                      </Button>
                    </div>
                  </div>
                  
                  {episode.synopsis && (
                    <p className="text-sm text-gray-700 mt-2">{episode.synopsis}</p>
                  )}
                  
                  <div className="flex justify-end mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => playEpisode(episode)}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Reproduzir
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  )
} 
"use client"

import { SeriesStats } from "@/components/series-stats"
import { SeriesFilters } from "@/components/series-filters"
import { SeriesCard } from "@/components/series-card"
import { SeriesListView } from "@/components/series-list-view"
import { SQLiteInitializer } from "@/components/sqlite-initializer"
import { AppLayout } from "@/components/app-layout"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDatabase } from "@/hooks/use-database"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { isElectron } from "@/lib/electron-bridge"

export default function SeriesPage() {
  const router = useRouter()
  const { series, hds, loading, error } = useDatabase()
  const [filteredSeries, setFilteredSeries] = useState(series)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Atualizar séries filtradas quando os dados mudarem
  useEffect(() => {
    setFilteredSeries(series)
  }, [series])

  // Manipulador para alterações de filtro
  const handleFilterChange = (filters: any) => {
    let result = [...series]

    // Filtrar por texto de pesquisa
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(serie => 
        serie.title.toLowerCase().includes(searchLower) ||
        (serie.synopsis && serie.synopsis.toLowerCase().includes(searchLower))
      )
    }

    // Filtrar por HD
    if (filters.hdId) {
      result = result.filter(serie => serie.hdId === filters.hdId)
    }

    // Filtrar por visibilidade
    if (!filters.showHidden) {
      result = result.filter(serie => !serie.hidden)
    }

    // Filtrar por status de visualização
    if (filters.showWatched !== "all") {
      if (filters.showWatched === "watched") {
        result = result.filter(serie => {
          // Verificar se todos os episódios foram assistidos
          let totalEpisodes = 0
          let watchedEpisodes = 0
          serie.seasons.forEach(season => {
            season.episodes.forEach(episode => {
              totalEpisodes++
              if (episode.watched) watchedEpisodes++
            })
          })
          return totalEpisodes > 0 && watchedEpisodes === totalEpisodes
        })
      } else if (filters.showWatched === "unwatched") {
        result = result.filter(serie => {
          // Verificar se nenhum episódio foi assistido
          let episodesWatched = false
          for (const season of serie.seasons) {
            for (const episode of season.episodes) {
              if (episode.watched) {
                episodesWatched = true
                break
              }
            }
            if (episodesWatched) break
          }
          return !episodesWatched
        })
      } else if (filters.showWatched === "inProgress") {
        result = result.filter(serie => {
          // Verificar se alguns episódios foram assistidos, mas não todos
          let totalEpisodes = 0
          let watchedEpisodes = 0
          serie.seasons.forEach(season => {
            season.episodes.forEach(episode => {
              totalEpisodes++
              if (episode.watched) watchedEpisodes++
            })
          })
          return totalEpisodes > 0 && watchedEpisodes > 0 && watchedEpisodes < totalEpisodes
        })
      }
    }

    // Filtrar por gênero
    if (filters.genres && filters.genres.length > 0) {
      result = result.filter(serie => {
        if (!serie.genres || !Array.isArray(serie.genres)) return false
        return filters.genres.some((genre: string) => serie.genres!.includes(genre))
      })
    }

    // Filtrar por ano
    if (filters.years && filters.years.length > 0) {
      result = result.filter(serie => {
        if (!serie.year) return false
        const yearStr = String(serie.year)
        // Verificar anos únicos ou intervalos (2020-2023)
        if (yearStr.includes('-')) {
          const [startYear, endYear] = yearStr.split('-').map(y => y.trim())
          return filters.years.some((year: string) => {
            const yearNum = parseInt(year)
            const startNum = parseInt(startYear)
            const endNum = parseInt(endYear)
            return yearNum >= startNum && yearNum <= endNum
          })
        } else {
          return filters.years.includes(yearStr.trim())
        }
      })
    }

    // Ordenar resultados
    result.sort((a, b) => {
      if (filters.sortBy === "title") {
        return filters.sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      } 
      
      if (filters.sortBy === "year") {
        const yearA = a.year ? String(a.year).split('-')[0] : "0"
        const yearB = b.year ? String(b.year).split('-')[0] : "0"
        return filters.sortOrder === "asc"
          ? parseInt(yearA) - parseInt(yearB)
          : parseInt(yearB) - parseInt(yearA)
      }
      
      if (filters.sortBy === "progress") {
        const progressA = calculateProgress(a)
        const progressB = calculateProgress(b)
        return filters.sortOrder === "asc"
          ? progressA - progressB
          : progressB - progressA
      }
      
      if (filters.sortBy === "seasonCount") {
        return filters.sortOrder === "asc"
          ? a.seasons.length - b.seasons.length
          : b.seasons.length - a.seasons.length
      }
      
      if (filters.sortBy === "episodeCount") {
        const episodesA = a.seasons.reduce((count, season) => count + season.episodes.length, 0)
        const episodesB = b.seasons.reduce((count, season) => count + season.episodes.length, 0)
        return filters.sortOrder === "asc"
          ? episodesA - episodesB
          : episodesB - episodesA
      }
      
      return 0
    })

    setFilteredSeries(result)
  }

  // Calcular progresso de uma série
  const calculateProgress = (serie: any) => {
    let totalEpisodes = 0
    let watchedEpisodes = 0
    
    serie.seasons.forEach((season: any) => {
      season.episodes.forEach((episode: any) => {
        totalEpisodes++
        if (episode.watched) {
          watchedEpisodes++
        }
      })
    })
    
    return totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0
  }

  // Navegar para a página de detalhes de uma série
  const handleSeriesClick = (id: string) => {
    router.push(`/series/${id}`)
  }

  // Renderizar o conteúdo da página
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Séries</h1>
          <Button className="mt-2 sm:mt-0" onClick={() => router.push("/series/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Série
          </Button>
        </div>
        
        {isElectron && <SQLiteInitializer />}
        
        <SeriesStats />
        
        <SeriesFilters 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onFilterChange={handleFilterChange}
        />
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className="aspect-[2/3] bg-muted rounded-lg"
              />
            ))}
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {series.length === 0 
                ? "Nenhuma série encontrada. Adicione séries para começar."
                : "Nenhuma série corresponde aos filtros selecionados."}
            </p>
            {series.length === 0 && (
              <Button onClick={() => router.push("/series/add")}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Série
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredSeries.map(serie => (
              <SeriesCard 
                key={serie.id} 
                series={serie}
                hd={hds.find(hd => hd.id === serie.hdId)}
              />
            ))}
          </div>
        ) : (
          <SeriesListView 
            series={filteredSeries}
            hds={hds}
            onSeriesClick={handleSeriesClick}
          />
        )}
      </div>
    </AppLayout>
  )
}


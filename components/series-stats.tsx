"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { HardDrive, Clock, Film, Calendar, CheckCircle } from "lucide-react"
import { useDatabase } from "@/hooks/use-database"
import type { Series, HD } from "@/lib/types"

export function SeriesStats() {
  const { series, hds, loading } = useDatabase()
  const [stats, setStats] = useState({
    totalSeries: 0,
    totalEpisodes: 0,
    watchedEpisodes: 0,
    episodePercentage: 0,
    totalWatchTime: 0,
    totalWatchDays: 0,
    activeHDs: 0,
    totalHDs: 0,
    totalSpace: 0,
    freeSpace: 0,
    spacePercentage: 0
  })

  // Calcular estatísticas quando os dados mudarem
  useEffect(() => {
    if (loading) return

    // Estatísticas de séries e episódios
    let totalSeries = series.filter(s => !s.hidden).length
    let totalEpisodes = 0
    let watchedEpisodes = 0
    let totalWatchTime = 0 // em minutos

    // Calcular estatísticas de episódios
    series.forEach(serie => {
      if (serie.hidden) return

      serie.seasons.forEach(season => {
        season.episodes.forEach(episode => {
          totalEpisodes++
          if (episode.watched) {
            watchedEpisodes++
            totalWatchTime += episode.duration
          }
        })
      })
    })

    // Estatísticas de HDs
    const activeHDs = hds.filter(hd => hd.connected).length
    const totalHDs = hds.length
    
    // Calcular espaço total e livre
    let totalSpace = 0
    let freeSpace = 0
    
    hds.forEach(hd => {
      totalSpace += hd.totalSpace
      freeSpace += hd.freeSpace
    })

    // Calcular percentuais
    const episodePercentage = totalEpisodes > 0 
      ? Math.round((watchedEpisodes / totalEpisodes) * 100) 
      : 0
    
    const spacePercentage = totalSpace > 0 
      ? Math.round(((totalSpace - freeSpace) / totalSpace) * 100)
      : 0

    // Converter tempo total de minutos para dias (considerando 8h/dia)
    const totalWatchDays = Math.round((totalWatchTime / 60 / 8) * 10) / 10

    // Atualizar estado
    setStats({
      totalSeries,
      totalEpisodes,
      watchedEpisodes,
      episodePercentage,
      totalWatchTime,
      totalWatchDays,
      activeHDs,
      totalHDs,
      totalSpace,
      freeSpace,
      spacePercentage
    })
  }, [series, hds, loading])

  // Formatar o tempo total em horas
  const formatWatchTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${hours}h (~${stats.totalWatchDays} dias)`
    }
    return `${hours}h`
  }

  // Formatar espaço em TB
  const formatSpace = (tb: number) => {
    return `${tb.toFixed(2)} TB`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-muted/30">
            <CardContent className="p-6 h-[100px]"></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard 
        title="Total de Séries"
        value={stats.totalSeries.toString()}
        subValue={`${stats.totalEpisodes} episódios`}
        icon={<Film className="h-5 w-5 text-blue-500" />}
      />
      
      <StatCard 
        title="Episódios Assistidos"
        value={`${stats.watchedEpisodes}`}
        subValue={`${stats.episodePercentage}% do total`}
        icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        progress={stats.episodePercentage}
      />
      
      <StatCard 
        title="Tempo Total Assistido"
        value={formatWatchTime(stats.totalWatchTime)}
        subValue={`~${stats.totalWatchDays} dias`}
        icon={<Clock className="h-5 w-5 text-amber-500" />}
      />
      
      <StatCard 
        title="HDs Ativos"
        value={`${stats.activeHDs}/${stats.totalHDs}`}
        subValue={`${formatSpace(stats.freeSpace)} livres`}
        icon={<HardDrive className="h-5 w-5 text-purple-500" />}
      />
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  subValue?: string
  icon?: React.ReactNode
  progress?: number
}

function StatCard({ title, value, subValue, icon, progress }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
          </div>
          {icon && (
            <div className="p-2 rounded-full bg-background border">
              {icon}
            </div>
          )}
        </div>
        
        {typeof progress === 'number' && (
          <Progress className="h-2 mt-4" value={progress} />
        )}
      </CardContent>
    </Card>
  )
} 
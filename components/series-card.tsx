"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, Film, Clock, Calendar, MoreHorizontal, HardDrive, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Series, HD } from "@/lib/types"

interface SeriesCardProps {
  series: Series
  hd?: HD
  className?: string
  onToggleVisibility?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
}

export function SeriesCard({ 
  series, 
  hd,
  className,
  onToggleVisibility,
  onDelete,
  onEdit
}: SeriesCardProps) {
  const [imageError, setImageError] = useState(false)
  
  // Calcular o progresso de visualização
  const calculateProgress = (): number => {
    let totalEpisodes = 0
    let watchedEpisodes = 0
    
    series.seasons.forEach(season => {
      season.episodes.forEach(episode => {
        totalEpisodes++
        if (episode.watched) {
          watchedEpisodes++
        }
      })
    })
    
    return totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0
  }
  
  const progress = calculateProgress()
  const isHdConnected = hd?.connected ?? true
  
  // Total de temporadas e episódios
  const totalSeasons = series.seasons.length
  const totalEpisodes = series.seasons.reduce((acc, season) => 
    acc + season.episodes.length, 0)
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card transition-all duration-300 hover:shadow-md dark:hover:shadow-primary/10",
        isHdConnected ? "" : "opacity-75",
        className
      )}
    >
      {/* HD Desconectado Indicador */}
      {!isHdConnected && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[1px]">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
      )}
      
      {/* Badge de Status */}
      {progress > 0 && (
        <Badge 
          variant={progress === 100 ? "secondary" : "outline"} 
          className="absolute right-2 top-2 z-10"
        >
          {progress === 100 ? "Completo" : `${progress}%`}
        </Badge>
      )}
      
      {/* Menu de Ações */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1 z-10 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit?.(series.id)}>
            Editar série
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleVisibility?.(series.id)}>
            {series.hidden ? "Mostrar série" : "Ocultar série"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive" 
            onClick={() => onDelete?.(series.id)}
          >
            Remover série
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Link para página de detalhes */}
      <Link href={`/series/${series.id}`} className="block h-full w-full">
        <div className="aspect-[2/3] relative">
          {imageError || !series.poster ? (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Film className="h-10 w-10 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={series.poster}
              alt={series.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          )}
          
          {/* Overlay com informações */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 p-3 flex flex-col justify-end">
            <div className="space-y-1 text-white">
              <h3 className="font-semibold line-clamp-2 text-base">
                {series.title}
              </h3>
              <div className="flex items-center text-xs space-x-2">
                <span className="flex items-center gap-1">
                  <Film className="h-3 w-3" />
                  {totalSeasons} {totalSeasons === 1 ? "temporada" : "temporadas"}
                </span>
                <span>•</span>
                <span>{totalEpisodes} episódios</span>
              </div>
              {series.year && (
                <div className="flex items-center text-xs">
                  <Calendar className="mr-1 h-3 w-3" />
                  <span>{series.year}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Barra de Progresso */}
        <div className="p-3">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <h3 className="font-medium truncate">{series.title}</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress 
                  value={progress} 
                  className="h-1.5"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {progress}% assistido
                  {progress > 0 && progress < 100 && (
                    <span> • {totalEpisodes - Math.round(totalEpisodes * progress / 100)} episódios restantes</span>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Link>
    </div>
  )
} 
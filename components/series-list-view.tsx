"use client"

import { useMemo } from "react"
import { MoreHorizontal, Film, Calendar, Eye, EyeOff, Edit, Trash2, HardDrive, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Series, HD } from "@/lib/types"

interface SeriesListViewProps {
  series: Series[]
  hds: HD[]
  onSeriesClick: (id: string) => void
  onToggleVisibility?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
}

export function SeriesListView({
  series,
  hds,
  onSeriesClick,
  onToggleVisibility,
  onDelete,
  onEdit
}: SeriesListViewProps) {
  
  // Memoizar o mapeamento de IDs de HD para objetos HD
  const hdMap = useMemo(() => {
    return hds.reduce((acc, hd) => {
      acc[hd.id] = hd
      return acc
    }, {} as Record<string, HD>)
  }, [hds])
  
  // Calcular informações de cada série
  const getSeriesDetails = (series: Series) => {
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
    
    const progress = totalEpisodes > 0 
      ? Math.round((watchedEpisodes / totalEpisodes) * 100) 
      : 0
    
    return {
      totalSeasons: series.seasons.length,
      totalEpisodes,
      watchedEpisodes,
      progress,
      hd: hdMap[series.hdId],
      isHdConnected: hdMap[series.hdId]?.connected ?? false
    }
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Série</TableHead>
            <TableHead>Temporadas</TableHead>
            <TableHead>Episódios</TableHead>
            <TableHead>Ano</TableHead>
            <TableHead>HD</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Nenhuma série encontrada
              </TableCell>
            </TableRow>
          ) : (
            series.map(serie => {
              const { 
                totalSeasons, 
                totalEpisodes, 
                watchedEpisodes, 
                progress, 
                hd, 
                isHdConnected 
              } = getSeriesDetails(serie)
              
              return (
                <TableRow 
                  key={serie.id}
                  className="cursor-pointer group"
                  onClick={() => onSeriesClick(serie.id)}
                >
                  <TableCell className="font-medium flex items-center gap-2">
                    {serie.hidden && <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    <div className="flex-grow">
                      {serie.title}
                      {serie.genres && serie.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {serie.genres.slice(0, 3).map(genre => (
                            <Badge key={genre} variant="outline" className="text-xs px-1 py-0 h-4">
                              {genre}
                            </Badge>
                          ))}
                          {serie.genres.length > 3 && (
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                              +{serie.genres.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{totalSeasons}</TableCell>
                  <TableCell>{watchedEpisodes}/{totalEpisodes}</TableCell>
                  <TableCell>{serie.year || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {hd ? (
                        <>
                          {isHdConnected ? (
                            <HardDrive className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          )}
                          <span className={isHdConnected ? "" : "text-muted-foreground line-through"}>
                            {hd.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Desconhecido</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-2 flex-grow" />
                            <span className="text-xs">{progress}%</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {progress === 100 ? (
                            <p>Todos os episódios assistidos</p>
                          ) : progress === 0 ? (
                            <p>Nenhum episódio assistido</p>
                          ) : (
                            <p>{watchedEpisodes} de {totalEpisodes} episódios assistidos</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={e => {
                          e.stopPropagation()
                          onEdit?.(serie.id)
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={e => {
                          e.stopPropagation()
                          onToggleVisibility?.(serie.id)
                        }}>
                          {serie.hidden ? (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Mostrar série
                            </>
                          ) : (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Ocultar série
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={e => {
                            e.stopPropagation()
                            onDelete?.(serie.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
} 
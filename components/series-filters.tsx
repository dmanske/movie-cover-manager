"use client"

import { useState, useEffect } from "react"
import { Search, X, Filter, SlidersHorizontal, CheckSquare, Square, LayoutGrid, LayoutList } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDatabase } from "@/hooks/use-database"
import { Checkbox } from "@/components/ui/checkbox"
import type { HD } from "@/lib/types"

type FilterOptions = {
  search: string
  hdId: string | null
  showHidden: boolean
  sortBy: "title" | "year" | "progress" | "seasonCount" | "episodeCount"
  sortOrder: "asc" | "desc"
  showWatched: "all" | "watched" | "unwatched" | "inProgress"
  genres: string[]
  years: string[]
}

interface SeriesFiltersProps {
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  onFilterChange: (filters: FilterOptions) => void
}

export function SeriesFilters({ 
  viewMode, 
  onViewModeChange, 
  onFilterChange 
}: SeriesFiltersProps) {
  const { hds, series, loading } = useDatabase()
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    hdId: null,
    showHidden: false,
    sortBy: "title",
    sortOrder: "asc",
    showWatched: "all",
    genres: [],
    years: []
  })
  
  // Coletar todos os gêneros e anos das séries
  const [allGenres, setAllGenres] = useState<string[]>([])
  const [allYears, setAllYears] = useState<string[]>([])
  
  // Processar gêneros e anos disponíveis
  useEffect(() => {
    if (loading) return
    
    // Extrair gêneros únicos
    const genresSet = new Set<string>()
    series.forEach(serie => {
      if (serie.genres) {
        serie.genres.forEach(genre => genresSet.add(genre))
      }
    })
    setAllGenres(Array.from(genresSet).sort())
    
    // Extrair anos únicos
    const yearsSet = new Set<string>()
    series.forEach(serie => {
      if (serie.year) {
        // Lidar com formato único (2020) ou intervalo (2020-2023)
        const yearStr = String(serie.year)
        if (yearStr.includes('-')) {
          const [startYear, endYear] = yearStr.split('-')
          yearsSet.add(startYear.trim())
          yearsSet.add(endYear.trim())
        } else {
          yearsSet.add(yearStr.trim())
        }
      }
    })
    setAllYears(Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a))) // Ordenar decrescente
  }, [series, loading])
  
  // Notificar o componente pai quando os filtros mudarem
  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])
  
  // Manipuladores para alterações de filtro
  const updateFilter = <K extends keyof FilterOptions>(
    key: K, 
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  // Limpar todos os filtros
  const clearFilters = () => {
    setFilters({
      search: "",
      hdId: null,
      showHidden: false,
      sortBy: "title",
      sortOrder: "asc",
      showWatched: "all",
      genres: [],
      years: []
    })
  }
  
  // Contar filtros ativos
  const getActiveFilterCount = (): number => {
    let count = 0
    if (filters.search) count++
    if (filters.hdId) count++
    if (filters.showHidden) count++
    if (filters.showWatched !== "all") count++
    if (filters.genres.length > 0) count++
    if (filters.years.length > 0) count++
    return count
  }
  
  // Formatar HD para exibição
  const getHdName = (hdId: string): string => {
    const hd = hds.find(h => h.id === hdId)
    return hd ? hd.name : "HD Desconhecido"
  }
  
  return (
    <div className="mb-6 space-y-4">
      {/* Barra superior com pesquisa e filtros */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar séries..."
            className="pl-9 bg-background"
            value={filters.search}
            onChange={e => updateFilter("search", e.target.value)}
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => updateFilter("search", "")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Seletor de HDs */}
        <Select
          value={filters.hdId || "all_hds"}
          onValueChange={value => updateFilter("hdId", value === "all_hds" ? null : value)}
        >
          <SelectTrigger className="w-[160px] shrink-0">
            <SelectValue placeholder="Todos os HDs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_hds">Todos os HDs</SelectItem>
            {hds.map(hd => (
              <SelectItem key={hd.id} value={hd.id}>
                {hd.name} {!hd.connected && "(Desconectado)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Botão de ordenação */}
        <Select
          value={`${filters.sortBy}_${filters.sortOrder}`}
          onValueChange={value => {
            const [sortBy, sortOrder] = value.split("_") as [
              FilterOptions["sortBy"], 
              FilterOptions["sortOrder"]
            ]
            updateFilter("sortBy", sortBy)
            updateFilter("sortOrder", sortOrder)
          }}
        >
          <SelectTrigger className="w-[160px] shrink-0">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title_asc">Título (A-Z)</SelectItem>
            <SelectItem value="title_desc">Título (Z-A)</SelectItem>
            <SelectItem value="year_desc">Ano (Mais recente)</SelectItem>
            <SelectItem value="year_asc">Ano (Mais antigo)</SelectItem>
            <SelectItem value="progress_desc">Progresso (Maior)</SelectItem>
            <SelectItem value="progress_asc">Progresso (Menor)</SelectItem>
            <SelectItem value="seasonCount_desc">Mais temporadas</SelectItem>
            <SelectItem value="episodeCount_desc">Mais episódios</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Menu de filtros avançados */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 shrink-0">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>Filtros</DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Status
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.showWatched === "all"}
                onCheckedChange={() => updateFilter("showWatched", "all")}
              >
                Todas as séries
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showWatched === "watched"}
                onCheckedChange={() => updateFilter("showWatched", "watched")}
              >
                Assistidas (100%)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showWatched === "unwatched"}
                onCheckedChange={() => updateFilter("showWatched", "unwatched")}
              >
                Não assistidas (0%)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showWatched === "inProgress"}
                onCheckedChange={() => updateFilter("showWatched", "inProgress")}
              >
                Em progresso
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            {/* Opção para mostrar séries ocultas */}
            <div className="px-2 py-1.5 text-sm flex items-center">
              <Checkbox 
                id="show-hidden" 
                checked={filters.showHidden}
                onCheckedChange={checked => 
                  updateFilter("showHidden", Boolean(checked))
                }
              />
              <label 
                htmlFor="show-hidden"
                className="ml-2 cursor-pointer"
              >
                Mostrar séries ocultas
              </label>
            </div>
            
            <DropdownMenuSeparator />
            
            {/* Filtro de gêneros */}
            {allGenres.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Gêneros
                </DropdownMenuLabel>
                <div className="max-h-32 overflow-y-auto px-1">
                  {allGenres.map(genre => (
                    <div key={genre} className="px-1 py-1.5 text-sm flex items-center">
                      <Checkbox 
                        id={`genre-${genre}`} 
                        checked={filters.genres.includes(genre)}
                        onCheckedChange={checked => {
                          if (checked) {
                            updateFilter("genres", [...filters.genres, genre])
                          } else {
                            updateFilter("genres", filters.genres.filter(g => g !== genre))
                          }
                        }}
                      />
                      <label 
                        htmlFor={`genre-${genre}`}
                        className="ml-2 cursor-pointer"
                      >
                        {genre}
                      </label>
                    </div>
                  ))}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Filtro de anos */}
            {allYears.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Anos
                </DropdownMenuLabel>
                <div className="max-h-32 overflow-y-auto px-1">
                  {allYears.map(year => (
                    <div key={year} className="px-1 py-1.5 text-sm flex items-center">
                      <Checkbox 
                        id={`year-${year}`} 
                        checked={filters.years.includes(year)}
                        onCheckedChange={checked => {
                          if (checked) {
                            updateFilter("years", [...filters.years, year])
                          } else {
                            updateFilter("years", filters.years.filter(y => y !== year))
                          }
                        }}
                      />
                      <label 
                        htmlFor={`year-${year}`}
                        className="ml-2 cursor-pointer"
                      >
                        {year}
                      </label>
                    </div>
                  ))}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem 
              className="justify-center text-center text-muted-foreground"
              onClick={clearFilters}
            >
              Limpar filtros
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Botões de alternância de visualização */}
        <div className="flex ml-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className="rounded-r-none"
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            className="rounded-l-none"
            onClick={() => onViewModeChange("list")}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Linha de filtros aplicados */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filtros:</span>
          
          {/* Filtro de HD */}
          {filters.hdId && (
            <Badge variant="secondary" className="gap-1 pl-2">
              HD: {getHdName(filters.hdId)}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 -mr-1 rounded-full"
                onClick={() => updateFilter("hdId", null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {/* Filtro de status assistido */}
          {filters.showWatched !== "all" && (
            <Badge variant="secondary" className="gap-1 pl-2">
              {filters.showWatched === "watched" && "Assistidas"}
              {filters.showWatched === "unwatched" && "Não assistidas"}
              {filters.showWatched === "inProgress" && "Em progresso"}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 -mr-1 rounded-full"
                onClick={() => updateFilter("showWatched", "all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {/* Filtro de séries ocultas */}
          {filters.showHidden && (
            <Badge variant="secondary" className="gap-1 pl-2">
              Inclui ocultas
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 -mr-1 rounded-full"
                onClick={() => updateFilter("showHidden", false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {/* Filtros de gênero */}
          {filters.genres.map(genre => (
            <Badge key={genre} variant="secondary" className="gap-1 pl-2">
              {genre}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 -mr-1 rounded-full"
                onClick={() => updateFilter("genres", filters.genres.filter(g => g !== genre))}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {/* Filtros de ano */}
          {filters.years.map(year => (
            <Badge key={year} variant="secondary" className="gap-1 pl-2">
              {year}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 -mr-1 rounded-full"
                onClick={() => updateFilter("years", filters.years.filter(y => y !== year))}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs text-muted-foreground"
            onClick={clearFilters}
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  )
} 
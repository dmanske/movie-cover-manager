"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Eye, EyeOff, Grid, List, HardDrive, Filter, Edit, Search, Clock, ScanLine, FolderOpen, RefreshCw, Plus, CheckCircle, Trash2, Info, SlidersHorizontal, Loader2 } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
import { AddSeries } from "@/components/add-series"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { HD, Series } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { electronAPI, isElectron } from "@/lib/electron-bridge"
import { useRouter } from "next/navigation"
import { ImageManager } from "@/components/utils/image-manager"
import { cn } from "@/lib/utils"
import type { Season as SeasonType, Episode as EpisodeType } from "../lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { useDatabase } from "@/hooks/use-database"

// Interface para a informação de uma série retornada pelo escaneamento
interface SeriesInfoFromScan {
  title: string
  path: string
  imdbId?: string
  year?: string
  posterPath?: string
  backdropPath?: string
  seasons: {
    season: number
    episodes: {
      episode: number
      path: string
      filename: string
    }[]
  }[]
}

export function SeriesLibrary() {
  const { toast } = useToast()
  const { 
    series, 
    hds, 
    updateSeriesVisibility, 
    refreshData, 
    loading: dbLoading, 
    error: dbError 
  } = useDatabase()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showHidden, setShowHidden] = useState(false)
  const [hdFilter, setHdFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"title" | "year" | "watched">("title")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  
  // Estados para o escaneamento
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanMessage, setScanMessage] = useState("")
  const [scanDialogOpen, setScanDialogOpen] = useState(false)
  const [forceRescan, setForceRescan] = useState(false)
  
  // Verificar automaticamente HDs conectados ao carregar o componente
  useEffect(() => {
    if (isElectron && series.length === 0 && !dbLoading) {
      // Escanear automaticamente na primeira carga se não houver séries
      autoScanConnectedHDs();
    }
  }, [series, dbLoading]);
  
  // Escaneamento automático de HDs conectados
  const autoScanConnectedHDs = async () => {
    // Verificar se há HDs conectados
    const connectedHDs = hds.filter(hd => hd.connected);
    
    if (connectedHDs.length === 0) {
      toast({
        title: "Nenhum HD conectado",
        description: "Conecte um HD para escanear automaticamente.",
        variant: "default",
      });
      return;
    }
    
    // Iniciar escaneamento automático
    try {
      setIsScanning(true);
      setScanProgress(0);
      setScanMessage("Iniciando escaneamento automático...");
      
      for (const hd of connectedHDs) {
        setScanMessage(`Escaneando ${hd.name}...`);
        
        // Buscar a chave da API
        const apiKey = localStorage.getItem("imdbApiKey") || "3e43fe8dd3d355be4c67778958173f5b";
        
        if (typeof electronAPI.scanDriveForSeries === 'function') {
          // Escanear o HD
          const result = await electronAPI.scanDriveForSeries(hd.path, apiKey, forceRescan);
          
          if (result.success) {
            setScanMessage(`HD ${hd.name} escaneado. Processando resultados...`);
            setScanProgress((prev) => prev + (100 / connectedHDs.length));
          } else {
            console.error(`Erro ao escanear ${hd.name}:`, result.error);
            setScanMessage(`Erro ao escanear ${hd.name}: ${result.error}`);
          }
        }
      }
      
      // Atualizar dados após o escaneamento
      await refreshData();
      
      toast({
        title: "Escaneamento concluído",
        description: `Todos os HDs conectados foram escaneados.`,
        variant: "success",
      });
    } catch (error: any) {
      console.error("Erro durante o escaneamento automático:", error);
      toast({
        title: "Erro",
        description: `Ocorreu um erro durante o escaneamento: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };
  
  // Função para iniciar o escaneamento manual
  const startScan = async () => {
    try {
      setIsScanning(true);
      setScanProgress(0);
      setScanMessage("Iniciando escaneamento manual...");
      
      // Obter a chave da API
      const apiKey = localStorage.getItem("imdbApiKey") || "3e43fe8dd3d355be4c67778958173f5b";
      
      // Escaneamento manual de todos os HDs conectados
      const connectedHDs = hds.filter(hd => hd.connected);
      
      if (connectedHDs.length === 0) {
        toast({
          title: "Nenhum HD conectado",
          description: "Conecte um HD para escanear.",
          variant: "default",
        });
        setIsScanning(false);
        return;
      }
      
      for (const hd of connectedHDs) {
        setScanMessage(`Escaneando ${hd.name}...`);
        
        if (typeof electronAPI.scanDriveForSeries === 'function') {
          // Escanear o HD
          const result = await electronAPI.scanDriveForSeries(hd.path, apiKey, forceRescan);
          
          if (result.success) {
            setScanMessage(`HD ${hd.name} escaneado. Processando resultados...`);
            setScanProgress((prev) => prev + (100 / connectedHDs.length));
          } else {
            console.error(`Erro ao escanear ${hd.name}:`, result.error);
            setScanMessage(`Erro ao escanear ${hd.name}: ${result.error}`);
          }
        }
      }
      
      // Atualizar dados após o escaneamento
      await refreshData();
      
      toast({
        title: "Escaneamento concluído",
        description: `Todos os HDs conectados foram escaneados.`,
        variant: "success",
      });
    } catch (error: any) {
      console.error("Erro durante o escaneamento manual:", error);
      toast({
        title: "Erro",
        description: `Ocorreu um erro durante o escaneamento: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setScanProgress(100);
      setScanDialogOpen(false);
    }
  };
  
  // Alternar visibilidade da série
  const toggleSeriesVisibility = async (id: string) => {
    const serie = series.find(s => s.id === id);
    if (!serie) return;
    
    const success = await updateSeriesVisibility(id, !serie.hidden);
    
    if (success) {
      toast({
        title: serie.hidden ? "Série exibida" : "Série ocultada",
        description: `"${serie.title}" foi ${serie.hidden ? "exibida" : "ocultada"} com sucesso.`,
        variant: "success",
      });
    }
  };
  
  // Função para obter o texto de progresso de episódios
  const getEpisodesText = (series: Series) => {
    const totalSeasons = series.seasons.length;
    const totalEpisodes = series.seasons.reduce((total, season) => total + season.totalEpisodes, 0);
    const availableEpisodes = series.seasons.reduce((total, season) => total + season.availableEpisodes, 0);
    const watchedEpisodes = series.seasons.reduce((total, season) => {
      return total + season.episodes.filter(episode => episode.watched).length;
    }, 0);
    
    // Formatação de texto diferente baseada no número de temporadas
    if (totalSeasons > 1) {
      return `${watchedEpisodes}/${availableEpisodes} eps · ${totalSeasons} temps`;
    } else {
      return `${watchedEpisodes}/${availableEpisodes} episódios`;
    }
  };
  
  // Componente para exibir a imagem da série com fallback
  const SeriesImage = ({ src, alt, className, ...props }: any) => {
    const [imgSrc, setImgSrc] = useState(src || "/placeholder.svg?height=450&width=300");
    const [error, setError] = useState(false);
    
    useEffect(() => {
      setImgSrc(src || "/placeholder.svg?height=450&width=300");
      setError(false);
    }, [src]);
    
    if (error || !src) {
      return (
        <div 
          className={`flex items-center justify-center bg-gradient-to-br from-gray-200 to-blue-100 ${className}`}
          {...props}
        >
          <div className="text-center p-2">
            <div className="font-bold text-blue-900 text-sm">{alt}</div>
            {alt && alt.includes("(") && (
              <div className="text-xs text-blue-700">
                {alt.match(/\(([^)]+)\)/)?.[1] || ""}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        onError={() => {
          console.log(`Erro ao carregar imagem: ${src}, usando placeholder`);
          setError(true);
        }}
        {...props}
      />
    );
  };
  
  // Navegar para a visualização detalhada da série
  const viewSeriesDetail = (seriesId: string) => {
    window.location.href = `/series/${seriesId}`;
  };
  
  // Obter o nome do HD pelo ID
  const getHdName = (hdId: string): string => {
    const hd = hds.find(h => h.id === hdId);
    return hd ? hd.name : "HD Desconhecido";
  };
  
  // Filtrar e ordenar séries para exibição
  const filteredSeries = series
    .filter(serie => {
      // Filtro de busca
      const matchesSearch = serie.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtro de HD
      const matchesHd = hdFilter === null || hdFilter === "all" || 
                        hdFilter === "connected" && hds.find(h => h.id === serie.hdId)?.connected ||
                        hdFilter === "disconnected" && !hds.find(h => h.id === serie.hdId)?.connected ||
                        serie.hdId === hdFilter;
      
      // Filtro de visibilidade
      const matchesVisibility = showHidden || !serie.hidden;
      
      return matchesSearch && matchesHd && matchesVisibility;
    })
    .sort((a, b) => {
      // Ordenação
      if (sortBy === "title") {
        return sortOrder === "asc" 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      } else if (sortBy === "year") {
        const yearA = a.year ? a.year.toString() : "0";
        const yearB = b.year ? b.year.toString() : "0";
        return sortOrder === "asc" 
          ? yearA.localeCompare(yearB) 
          : yearB.localeCompare(yearA);
      } else {
        // watched
        return sortOrder === "asc" 
          ? (a.watched ? 1 : 0) - (b.watched ? 1 : 0)
          : (b.watched ? 1 : 0) - (a.watched ? 1 : 0);
      }
    });
  
  // Editar capa e informações da série manualmente
  const editSeriesInfo = (seriesId: string) => {
    // Implementar a edição manual de capa e informações
    // Isso será feito em um componente separado posteriormente
    console.log("Editar série:", seriesId);
  };
  
  // Verificar se estamos carregando dados
  if (dbLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-blue-800">Carregando séries...</p>
        </div>
      </div>
    );
  }
  
  // Verificar se ocorreu algum erro
  if (dbError) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-800">{dbError}</p>
          <Button 
            className="mt-4" 
            variant="destructive"
            onClick={() => refreshData()}
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Biblioteca de Séries</h1>
        <p className="text-blue-700">Gerencie sua coleção de séries</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão para escanear HDs */}
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setScanDialogOpen(true)}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ScanLine className="mr-2 h-4 w-4" />
            )}
            Escanear HDs
          </Button>

          {/* Botão para mostrar/ocultar séries escondidas */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHidden(!showHidden)}
            className={showHidden ? "bg-blue-100" : ""}
          >
            {showHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {showHidden ? "Mostrar Todas" : "Ocultas: Off"}
          </Button>

          {/* Filtro por HD */}
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
                    <div className={`mr-2 h-3 w-3 rounded-full ${hd.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    {hd.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Alternador de visualização */}
          <div className="flex items-center rounded border border-blue-200">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 rounded-l border-r px-2", {
                "bg-blue-100": viewMode === "grid",
              })}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 rounded-r px-2", {
                "bg-blue-100": viewMode === "list",
              })}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filtro/ordenação e busca */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortBy === "title"}
                onCheckedChange={() => setSortBy("title")}
              >
                Título
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "year"}
                onCheckedChange={() => setSortBy("year")}
              >
                Ano
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "watched"}
                onCheckedChange={() => setSortBy("watched")}
              >
                Assistido
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Ordem</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={sortOrder === "asc"}
                onCheckedChange={() => setSortOrder("asc")}
              >
                Crescente
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOrder === "desc"}
                onCheckedChange={() => setSortOrder("desc")}
              >
                Decrescente
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative flex max-w-[200px] items-center md:max-w-sm">
            <Search className="absolute left-2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar séries..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Galeria de Séries */}
      {filteredSeries.length === 0 ? (
        <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-lg border border-blue-200 bg-blue-50">
          <div className="text-center">
            <p className="text-lg font-medium text-blue-700">Nenhuma série encontrada</p>
            <p className="text-sm text-blue-500">
              {series.length === 0
                ? "Escaneie seus HDs conectados para encontrar séries"
                : "Tente ajustar os filtros aplicados"}
            </p>
            <Button 
              className="mt-4" 
              onClick={() => series.length === 0 ? startScan() : setHdFilter(null)}
            >
              {series.length === 0 ? (
                <>
                  <ScanLine className="mr-2 h-4 w-4" />
                  Escanear Agora
                </>
              ) : (
                <>
                  <Filter className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn("grid gap-4", {
          "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5": viewMode === "grid",
          "grid-cols-1": viewMode === "list"
        })}>
          {filteredSeries.map((serie) => (
            <Card 
              key={serie.id} 
              className="group cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-blue-400"
              onClick={() => viewSeriesDetail(serie.id)}
            >
              <div className={cn("relative", {
                "aspect-[2/3] h-[250px]": viewMode === "grid",
                "flex h-24": viewMode === "list"
              })}>
                {viewMode === "grid" ? (
                  // Grid View
                  <>
                    <SeriesImage
                      src={serie.poster}
                      alt={serie.title}
                      className="object-cover h-full w-full"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white"
                    >
                      <h3 className="font-bold text-white text-sm">{serie.title}</h3>
                      {serie.year && <p className="text-xs text-white/90">{serie.year}</p>}
                    </div>
                    <div className="absolute top-1 right-1 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-black/50 hover:bg-black/70 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSeriesVisibility(serie.id);
                        }}
                      >
                        <EyeOff className={cn("h-3 w-3", { hidden: !serie.hidden })} />
                        <Eye className={cn("h-3 w-3", { hidden: serie.hidden })} />
                        <span className="sr-only">
                          {serie.hidden ? "Mostrar série" : "Ocultar série"}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-black/50 hover:bg-black/70 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          editSeriesInfo(serie.id);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                        <span className="sr-only">Editar série</span>
                      </Button>
                    </div>
                  </>
                ) : (
                  // List View
                  <>
                    <div className="h-full w-24 flex-shrink-0">
                      <SeriesImage
                        src={serie.poster}
                        alt={serie.title}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-3">
                      <div>
                        <h3 className="font-medium text-sm">{serie.title}</h3>
                        {serie.year && <p className="text-xs text-gray-500">{serie.year}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] h-4 px-1 rounded ${serie.watched ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          {serie.watched ? 'Assistido' : 'Não assistido'}
                        </Badge>
                        <p className="text-xs text-gray-500">{getEpisodesText(serie)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 p-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-gray-100 hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSeriesVisibility(serie.id);
                        }}
                      >
                        <EyeOff className={cn("h-3 w-3", { hidden: !serie.hidden })} />
                        <Eye className={cn("h-3 w-3", { hidden: serie.hidden })} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-gray-100 hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          editSeriesInfo(serie.id);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
              {viewMode === "grid" && (
                <CardFooter className="flex flex-col items-start p-2 gap-1">
                  <div className="flex flex-col w-full">
                    <h3 className="font-medium text-xs truncate">{serie.title}</h3>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[8px] h-3 px-1 rounded border-blue-200",
                                {
                                  "bg-blue-50": hds.find(h => h.id === serie.hdId)?.connected,
                                  "bg-gray-100 text-gray-500": !hds.find(h => h.id === serie.hdId)?.connected
                                }
                              )}
                            >
                              <div className="flex items-center gap-1">
                                <div 
                                  className={cn(
                                    "w-1 h-1 rounded-full",
                                    {
                                      "bg-green-500": hds.find(h => h.id === serie.hdId)?.connected,
                                      "bg-red-500": !hds.find(h => h.id === serie.hdId)?.connected
                                    }
                                  )}
                                />
                                {getHdName(serie.hdId)}
                              </div>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {hds.find(h => h.id === serie.hdId)?.connected ? "HD Conectado" : "HD Desconectado"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {serie.hdPath && (
                        <Badge variant="outline" className="text-[8px] h-3 px-1 rounded bg-gray-50 border-gray-200 truncate max-w-[60px]" title={serie.hdPath}>
                          {serie.hdPath.split(/[\/\\]/).pop()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[8px] text-gray-500 mt-1">{getEpisodesText(serie)}</p>
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de Escaneamento */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Escanear HDs para Séries</DialogTitle>
            <DialogDescription>
              O sistema irá escanear automaticamente todos os HDs conectados para encontrar séries.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 mt-4">
              <label htmlFor="force-rescan" className="text-sm flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  id="force-rescan" 
                  checked={forceRescan}
                  onChange={(e) => setForceRescan(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Forçar reescaneamento (ignorar cache)</span>
              </label>
            </div>
            
            <div className="space-y-2 border rounded-md p-3 bg-blue-50">
              <h3 className="text-sm font-medium">HDs Conectados</h3>
              <div className="space-y-1">
                {hds.filter(hd => hd.connected).length === 0 ? (
                  <p className="text-xs text-gray-500">Nenhum HD conectado.</p>
                ) : (
                  hds.filter(hd => hd.connected).map(hd => (
                    <div key={hd.id} className="flex items-center text-xs">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      {hd.name} - {hd.path}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {isScanning && (
            <div className="mt-4 space-y-2 rounded-md bg-blue-50 p-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-700">{scanMessage}</span>
                <span className="text-blue-700">{scanProgress}%</span>
              </div>
              
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              
              <p className="text-xs text-blue-600">
                Aguarde enquanto escaneamos os HDs conectados em busca de séries.
                Este processo pode levar alguns minutos dependendo da quantidade de arquivos.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setScanDialogOpen(false)}
              disabled={isScanning}
            >
              Cancelar
            </Button>
            <Button 
              onClick={startScan} 
              disabled={isScanning || hds.filter(hd => hd.connected).length === 0}
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    </div>
  )
}


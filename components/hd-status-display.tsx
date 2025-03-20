"use client"

import { useState, useEffect } from "react"
import { HardDrive, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useDatabase } from "@/hooks/use-database"
import { electronAPI, isElectron } from "@/lib/electron-bridge"
import type { HD } from "@/lib/types"

export function HDStatusDisplay({ simple = false }: { simple?: boolean }) {
  const { hds, error, loading, updateHDConnection } = useDatabase()
  
  // Verificar HDs conectados periodicamente
  useEffect(() => {
    // Pular se estivermos carregando ou houver erro
    if (loading || error) return
    
    // Função para verificar HDs conectados
    const checkConnectedHDs = async () => {
      if (!hds || hds.length === 0) return
      
      for (const hd of hds) {
        try {
          // Verificar se o HD está conectado 
          // Aqui usamos o electronAPI direto para desacoplar do useDatabase
          // Isso permite checagens independentes das operações de banco
          if (isElectron && electronAPI && electronAPI.pathExists) {
            const exists = await electronAPI.pathExists(hd.path)
            if (exists !== hd.connected) {
              // Atualizar o status do HD apenas se mudou
              updateHDConnection(hd.id, exists)
            }
          }
        } catch (err) {
          console.error(`Erro ao verificar HD ${hd.name}:`, err)
        }
      }
    }
    
    // Verificar na montagem do componente
    checkConnectedHDs()
    
    // Configurar verificação periódica (a cada 30 segundos)
    const interval = setInterval(checkConnectedHDs, 30000)
    
    // Limpar o intervalo na desmontagem
    return () => clearInterval(interval)
  }, [hds, loading, error, updateHDConnection])
  
  // Versão simplificada - apenas mostrar contagem
  if (simple) {
    const connectedCount = hds.filter(hd => hd.connected).length
    const totalCount = hds.length
    
    return (
      <div className="flex items-center space-x-2">
        <HardDrive className={connectedCount > 0 ? "text-green-500" : "text-orange-500"} size={16} />
        <span className="text-sm">{connectedCount}/{totalCount} HDs</span>
      </div>
    )
  }
  
  // Versão completa com cards
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Status dos HDs</h3>
        <Badge variant={getHdsStatusVariant(hds)}>
          {getHdsStatusText(hds)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          // Placeholders de carregamento
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/30">
              <CardContent className="p-4 h-[100px]"></CardContent>
            </Card>
          ))
        ) : hds.length > 0 ? (
          // Listar HDs
          hds.map(hd => (
            <HDCard key={hd.id} hd={hd} />
          ))
        ) : (
          // Mensagem se não houver HDs
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center h-[100px]">
              <AlertTriangle className="text-orange-500 mb-2" />
              <p className="text-sm text-center text-muted-foreground">
                Nenhum HD cadastrado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Funções auxiliares para definir o status geral
function getHdsStatusText(hds: HD[]): string {
  if (hds.length === 0) return "Sem HDs"
  
  const connectedCount = hds.filter(hd => hd.connected).length
  
  if (connectedCount === 0) return "Todos desconectados"
  if (connectedCount === hds.length) return "Todos conectados"
  
  return `${connectedCount}/${hds.length} conectados`
}

function getHdsStatusVariant(hds: HD[]): "default" | "destructive" | "secondary" | "outline" {
  if (hds.length === 0) return "default"
  
  const connectedCount = hds.filter(hd => hd.connected).length
  
  if (connectedCount === 0) return "destructive"
  if (connectedCount === hds.length) return "secondary"
  
  return "outline"
}

// Componente de card para HD individual
function HDCard({ hd }: { hd: HD }) {
  // Calcular porcentagem de espaço usado
  const usedSpace = hd.totalSpace - hd.freeSpace
  const usedPercentage = Math.round((usedSpace / hd.totalSpace) * 100)
  
  // Determinar cor do indicador de espaço baseado na porcentagem usada
  const getSpaceColor = (percentage: number) => {
    if (percentage > 90) return "text-destructive"
    if (percentage > 70) return "text-orange-500"
    return "text-green-500"
  }
  
  return (
    <TooltipProvider>
      <Card className={`border-l-4 ${hd.connected ? `border-l-green-500` : `border-l-destructive`} transition-all duration-300`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium truncate max-w-[160px]">{hd.name}</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant={hd.connected ? "secondary" : "destructive"}
                      className="ml-2 px-1.5 h-5"
                    >
                      {hd.connected ? 
                        <CheckCircle className="h-3 w-3" /> : 
                        <AlertTriangle className="h-3 w-3" />
                      }
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{hd.connected ? "Conectado" : "Desconectado"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                {hd.path}
              </p>
            </div>
            
            <div 
              className={`w-7 h-7 rounded-full flex items-center justify-center border 
              ${hd.connected ? "border-green-500 bg-green-500/10" : "border-destructive bg-destructive/10"}`}
            >
              {hd.type === 'external' ? 
                <ExternalLink className="h-3.5 w-3.5" /> : 
                <HardDrive className="h-3.5 w-3.5" />
              }
            </div>
          </div>
          
          {/* Informações de espaço */}
          {hd.connected && (
            <>
              <div className="flex items-center justify-between text-xs mt-3 mb-1">
                <span className={getSpaceColor(usedPercentage)}>
                  {usedPercentage}% usado
                </span>
                <span className="text-muted-foreground">
                  {hd.freeSpace.toFixed(1)} TB livres
                </span>
              </div>
              <Progress value={usedPercentage} className="h-1" />
            </>
          )}
          
          {/* Mensagem quando desconectado */}
          {!hd.connected && (
            <div className="mt-3 px-2 py-1.5 bg-destructive/10 rounded text-xs text-center">
              HD atualmente desconectado
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 
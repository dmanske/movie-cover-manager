"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { electronAPI, isElectron } from "@/lib/electron-bridge"

export function MigrateToSQLite() {
  const { toast } = useToast()
  const [isMigrating, setIsMigrating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const migrateData = async () => {
    if (!isElectron) {
      toast({
        title: "Erro",
        description: "A migração só está disponível no aplicativo Electron.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsMigrating(true)
      setProgress(10)
      setResult(null)

      // Coletar dados do localStorage
      const data: any = {}
      
      // HDs
      const hdsData = localStorage.getItem("hds")
      if (hdsData) {
        data.hds = JSON.parse(hdsData)
        setProgress(30)
      }
      
      // Séries
      const seriesData = localStorage.getItem("series")
      if (seriesData) {
        data.series = JSON.parse(seriesData)
        setProgress(50)
      }
      
      // Verificar se há dados para migrar
      if (!data.hds && !data.series) {
        toast({
          title: "Sem dados para migração",
          description: "Não foram encontrados dados para migrar do localStorage.",
          variant: "default",
        })
        setIsMigrating(false)
        return
      }
      
      // Iniciar migração
      setProgress(70)
      const migrationResult = await electronAPI.db.migrateFromLocalStorage(data)
      setProgress(100)
      
      // Atualizar resultado
      setResult(migrationResult)
      
      if (migrationResult.success) {
        toast({
          title: "Migração concluída",
          description: migrationResult.message,
          variant: "success",
        })
      } else {
        toast({
          title: "Erro na migração",
          description: migrationResult.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Erro durante a migração: ${error.message}`
      })
      
      toast({
        title: "Erro",
        description: `Ocorreu um erro durante a migração: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-blue-800">Migrar para SQLite</h2>
      </div>

      <p className="text-sm text-blue-700">
        Migre seus dados do armazenamento local (localStorage) para o banco de dados SQLite para
        melhor performance e confiabilidade.
      </p>

      {result && (
        <Alert variant={result.success ? "success" : "destructive"}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {result.success ? "Migração concluída" : "Erro na migração"}
          </AlertTitle>
          <AlertDescription>
            {result.message}
          </AlertDescription>
        </Alert>
      )}

      {isMigrating && (
        <div className="space-y-2">
          <p className="text-xs text-blue-600">Migrando dados para SQLite...</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Button
        onClick={migrateData}
        disabled={isMigrating}
        className="w-full"
      >
        {isMigrating ? "Migrando..." : "Iniciar Migração"}
      </Button>
    </div>
  )
} 
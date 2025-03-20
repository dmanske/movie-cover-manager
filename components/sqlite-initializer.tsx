"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Database, CheckCircle } from "lucide-react"
import { electronAPI, isElectron } from "@/lib/electron-bridge"

export function SQLiteInitializer() {
  const [status, setStatus] = useState<"checking" | "unavailable" | "available" | "error">("checking")
  const [message, setMessage] = useState("Verificando banco de dados...")
  const [errorDetails, setErrorDetails] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  // Verificar status do banco de dados
  const checkDatabaseStatus = async () => {
    setStatus("checking")
    setMessage("Verificando banco de dados...")
    
    try {
      if (!isElectron) {
        setStatus("unavailable")
        setMessage("Banco de dados SQLite não disponível no navegador. Usando localStorage.")
        return
      }
      
      if (!electronAPI.db) {
        setStatus("unavailable")
        setMessage("API de banco de dados não encontrada. Usando localStorage.")
        return
      }
      
      // Verificar se o banco existe
      const result = await electronAPI.db.testConnection()
      
      if (result.success) {
        setStatus("available")
        setMessage("Banco de dados SQLite conectado com sucesso.")
      } else {
        setStatus("error")
        setMessage("Erro ao conectar ao banco de dados. Usando localStorage.")
        setErrorDetails(result.error || "Erro desconhecido")
      }
    } catch (err: any) {
      console.error("Erro ao verificar banco de dados:", err)
      setStatus("error")
      setMessage("Erro ao verificar banco de dados. Usando localStorage.")
      setErrorDetails(err.message || "Erro desconhecido")
    }
  }
  
  // Inicializar banco de dados
  const initializeDatabase = async () => {
    setStatus("checking")
    setMessage("Inicializando banco de dados...")
    
    try {
      if (!isElectron || !electronAPI.db) {
        setStatus("unavailable")
        setMessage("Não é possível inicializar o banco de dados no navegador.")
        return
      }
      
      // Criar/inicializar banco
      const result = await electronAPI.db.initializeDatabase()
      
      if (result.success) {
        setStatus("available")
        setMessage("Banco de dados inicializado com sucesso.")
        window.location.reload() // Recarregar a página para aplicar as alterações
      } else {
        setStatus("error")
        setMessage("Erro ao inicializar banco de dados.")
        setErrorDetails(result.error || "Erro desconhecido")
      }
    } catch (err: any) {
      console.error("Erro ao inicializar banco de dados:", err)
      setStatus("error")
      setMessage("Erro ao inicializar banco de dados.")
      setErrorDetails(err.message || "Erro desconhecido")
    }
  }
  
  // Migrar dados do localStorage para o SQLite
  const migrateFromLocalStorage = async () => {
    setStatus("checking")
    setMessage("Migrando dados do localStorage para SQLite...")
    
    try {
      if (!isElectron || !electronAPI.db) {
        setStatus("unavailable")
        setMessage("Não é possível migrar dados no navegador.")
        return
      }
      
      // Obter dados do localStorage
      const series = JSON.parse(localStorage.getItem("series") || "[]")
      const hds = JSON.parse(localStorage.getItem("hds") || "[]")
      
      // Migrar para SQLite
      if (series.length > 0) {
        for (const serie of series) {
          await electronAPI.db.saveSeries(serie)
        }
      }
      
      if (hds.length > 0) {
        for (const hd of hds) {
          await electronAPI.db.saveHD(hd)
        }
      }
      
      setStatus("available")
      setMessage(`Migração concluída. Migrados ${series.length} séries e ${hds.length} HDs.`)
      
      // Recarregar a página após um breve atraso
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      console.error("Erro ao migrar dados:", err)
      setStatus("error")
      setMessage("Erro ao migrar dados.")
      setErrorDetails(err.message || "Erro desconhecido")
    }
  }
  
  // Verificar status ao montar o componente
  useEffect(() => {
    checkDatabaseStatus()
  }, [])
  
  // Versão compacta para mostrar junto com outros componentes
  if (!isExpanded) {
    // Caso o banco esteja disponível e não tenha erros, não mostrar nada
    if (status === "available" && !errorDetails) {
      return null
    }
    
    return (
      <div className="mb-4 p-3 border rounded-md bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "available" ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : status === "checking" ? (
            <Database className="h-5 w-5 animate-pulse" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
          <div>
            <p className="text-sm font-medium">
              {status === "error" ? "Problema com banco de dados" : "Banco de dados SQLite"}
            </p>
            <p className="text-xs text-muted-foreground">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {status !== "available" && (
            <Button 
              onClick={initializeDatabase} 
              variant="default" 
              size="sm" 
              className="text-xs h-7 px-2"
            >
              Inicializar
            </Button>
          )}
          
          {status === "available" && (
            <Button 
              onClick={migrateFromLocalStorage} 
              variant="outline" 
              size="sm" 
              className="text-xs h-7 px-2"
            >
              Migrar Dados
            </Button>
          )}
          
          <Button 
            onClick={() => setIsExpanded(true)} 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 px-2"
          >
            Detalhes
          </Button>
        </div>
      </div>
    )
  }
  
  // Versão expandida com todos os detalhes
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 mb-6 border rounded-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Configuração do Banco de Dados</h3>
        <Button 
          onClick={() => setIsExpanded(false)} 
          variant="ghost" 
          size="sm"
        >
          Minimizar
        </Button>
      </div>
      
      <Alert 
        className={
          status === "unavailable" ? "border-yellow-500 bg-yellow-500/10" :
          status === "error" ? "border-destructive bg-destructive/10" :
          ""
        }
      >
        <div className="flex items-center gap-2">
          {status === "available" ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : status === "checking" ? (
            <Database className="h-5 w-5 animate-pulse" />
          ) : status === "unavailable" ? (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
          <AlertTitle>Status do Banco de Dados</AlertTitle>
        </div>
        <AlertDescription className="mt-2">
          {message}
          {errorDetails && (
            <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-auto">
              {errorDetails}
            </div>
          )}
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-wrap gap-2">
        <Button onClick={checkDatabaseStatus} variant="outline">
          Verificar Novamente
        </Button>
        
        {status !== "available" && isElectron && (
          <Button onClick={initializeDatabase} variant="default">
            Inicializar Banco de Dados
          </Button>
        )}
        
        {status === "available" && isElectron && (
          <Button onClick={migrateFromLocalStorage} variant="secondary">
            Migrar do localStorage
          </Button>
        )}
      </div>
    </div>
  )
} 
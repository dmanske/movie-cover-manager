"use client"

import { useState, useEffect, useCallback } from "react"
import { electronAPI, isElectron } from "@/lib/electron-bridge"
import { useToast } from "@/hooks/use-toast"
import type { Series, HD } from "@/lib/types"

interface UseDatabaseReturn {
  // Estado
  loading: boolean;
  error: string | null;
  
  // Séries
  series: Series[];
  getSeries: (id: string) => Series | undefined;
  saveSeries: (series: Series) => Promise<boolean>;
  deleteSeries: (id: string) => Promise<boolean>;
  updateSeriesVisibility: (id: string, hidden: boolean) => Promise<boolean>;
  
  // HDs
  hds: HD[];
  getHD: (id: string) => HD | undefined;
  saveHD: (hd: HD) => Promise<boolean>;
  deleteHD: (id: string) => Promise<boolean>;
  updateHDConnection: (id: string, connected: boolean) => Promise<boolean>;
  
  // Outros
  refreshData: () => Promise<void>;
}

export function useDatabase(): UseDatabaseReturn {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [series, setSeries] = useState<Series[]>([])
  const [hds, setHDs] = useState<HD[]>([])

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Verificar se estamos no Electron com acesso ao banco de dados
      if (!isElectron || !electronAPI || !electronAPI.db) {
        console.log("Banco de dados SQLite não disponível. Usando localStorage.");
        fallbackToLocalStorage();
        return;
      }
      
      // Tentar inicializar o banco se ele existir mas não estiver conectado
      try {
        const testResult = await electronAPI.db.testConnection();
        if (!testResult.success) {
          console.log("Testando inicialização do banco de dados...");
          await electronAPI.db.initializeDatabase();
        }
      } catch (dbInitError) {
        console.warn("Erro ao inicializar banco de dados:", dbInitError);
        fallbackToLocalStorage();
        return;
      }
      
      // Carregar HDs
      const hdsResult = await electronAPI.db.getAllHDs();
      if (hdsResult.success) {
        setHDs(hdsResult.data);
      } else {
        console.error(`Erro ao carregar HDs: ${hdsResult.error}`);
        setError(`Erro ao carregar HDs: ${hdsResult.error}`);
        fallbackToLocalStorage();
        return;
      }
      
      // Carregar séries
      const seriesResult = await electronAPI.db.getAllSeries();
      if (seriesResult.success) {
        setSeries(seriesResult.data);
      } else {
        console.error(`Erro ao carregar séries: ${seriesResult.error}`);
        setError(`Erro ao carregar séries: ${seriesResult.error}`);
        fallbackToLocalStorage();
        return;
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do banco:", err);
      setError(err.message);
      
      // Fallback para localStorage
      fallbackToLocalStorage();
    } finally {
      setLoading(false);
    }
  }, []);

  // Fallback para carregar dados do localStorage
  const fallbackToLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Carregar HDs
      const storedHDs = localStorage.getItem("hds");
      if (storedHDs) {
        setHDs(JSON.parse(storedHDs));
      }
      
      // Carregar séries
      const storedSeries = localStorage.getItem("series");
      if (storedSeries) {
        setSeries(JSON.parse(storedSeries));
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do localStorage:", err);
      setError(`Erro ao carregar dados do localStorage: ${err.message}`);
    }
  }, []);

  // Carregar dados quando o componente montar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Função para atualizar os dados
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Obter série por ID
  const getSeries = useCallback((id: string): Series | undefined => {
    return series.find((s) => s.id === id);
  }, [series]);

  // Obter HD por ID
  const getHD = useCallback((id: string): HD | undefined => {
    return hds.find((h) => h.id === id);
  }, [hds]);

  // Salvar série
  const saveSeries = useCallback(async (series: Series): Promise<boolean> => {
    try {
      if (isElectron && electronAPI.db) {
        // Salvar no banco de dados
        const result = await electronAPI.db.saveSeries(series);
        if (result.success) {
          await refreshData();
          return true;
        } else {
          toast({
            title: "Erro ao salvar série",
            description: result.error,
            variant: "destructive",
          });
          return false;
        }
      } else {
        // Fallback para localStorage
        const currentSeries = JSON.parse(localStorage.getItem("series") || "[]");
        const existingIndex = currentSeries.findIndex((s: Series) => s.id === series.id);
        
        if (existingIndex >= 0) {
          currentSeries[existingIndex] = series;
        } else {
          currentSeries.push(series);
        }
        
        localStorage.setItem("series", JSON.stringify(currentSeries));
        setSeries(currentSeries);
        return true;
      }
    } catch (err: any) {
      console.error("Erro ao salvar série:", err);
      toast({
        title: "Erro ao salvar série",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, refreshData]);

  // Excluir série
  const deleteSeries = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (isElectron && electronAPI.db) {
        // Excluir do banco de dados
        const result = await electronAPI.db.deleteSeries(id);
        if (result.success) {
          await refreshData();
          return true;
        } else {
          toast({
            title: "Erro ao excluir série",
            description: result.error,
            variant: "destructive",
          });
          return false;
        }
      } else {
        // Fallback para localStorage
        const currentSeries = JSON.parse(localStorage.getItem("series") || "[]");
        const newSeries = currentSeries.filter((s: Series) => s.id !== id);
        localStorage.setItem("series", JSON.stringify(newSeries));
        setSeries(newSeries);
        return true;
      }
    } catch (err: any) {
      console.error("Erro ao excluir série:", err);
      toast({
        title: "Erro ao excluir série",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, refreshData]);

  // Atualizar visibilidade da série
  const updateSeriesVisibility = useCallback(async (id: string, hidden: boolean): Promise<boolean> => {
    try {
      if (isElectron && electronAPI.db) {
        // Atualizar no banco de dados
        const result = await electronAPI.db.updateSeriesVisibility(id, hidden);
        if (result.success) {
          await refreshData();
          return true;
        } else {
          toast({
            title: "Erro ao atualizar visibilidade",
            description: result.error,
            variant: "destructive",
          });
          return false;
        }
      } else {
        // Fallback para localStorage
        const currentSeries = JSON.parse(localStorage.getItem("series") || "[]");
        const newSeries = currentSeries.map((s: Series) => 
          s.id === id ? { ...s, hidden } : s
        );
        localStorage.setItem("series", JSON.stringify(newSeries));
        setSeries(newSeries);
        return true;
      }
    } catch (err: any) {
      console.error("Erro ao atualizar visibilidade da série:", err);
      toast({
        title: "Erro ao atualizar visibilidade",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, refreshData]);

  // Salvar HD
  const saveHD = useCallback(async (hd: HD): Promise<boolean> => {
    try {
      if (isElectron && electronAPI.db) {
        // Salvar no banco de dados
        const result = await electronAPI.db.saveHD(hd);
        if (result.success) {
          await refreshData();
          return true;
        } else {
          toast({
            title: "Erro ao salvar HD",
            description: result.error,
            variant: "destructive",
          });
          return false;
        }
      } else {
        // Fallback para localStorage
        const currentHDs = JSON.parse(localStorage.getItem("hds") || "[]");
        const existingIndex = currentHDs.findIndex((h: HD) => h.id === hd.id);
        
        if (existingIndex >= 0) {
          currentHDs[existingIndex] = hd;
        } else {
          currentHDs.push(hd);
        }
        
        localStorage.setItem("hds", JSON.stringify(currentHDs));
        setHDs(currentHDs);
        return true;
      }
    } catch (err: any) {
      console.error("Erro ao salvar HD:", err);
      toast({
        title: "Erro ao salvar HD",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, refreshData]);

  // Excluir HD
  const deleteHD = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (isElectron && electronAPI.db) {
        // Excluir do banco de dados
        const result = await electronAPI.db.deleteHD(id);
        if (result.success) {
          await refreshData();
          return true;
        } else {
          toast({
            title: "Erro ao excluir HD",
            description: result.error,
            variant: "destructive",
          });
          return false;
        }
      } else {
        // Fallback para localStorage
        const currentHDs = JSON.parse(localStorage.getItem("hds") || "[]");
        const newHDs = currentHDs.filter((h: HD) => h.id !== id);
        localStorage.setItem("hds", JSON.stringify(newHDs));
        setHDs(newHDs);
        return true;
      }
    } catch (err: any) {
      console.error("Erro ao excluir HD:", err);
      toast({
        title: "Erro ao excluir HD",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, refreshData]);

  // Atualizar status de conexão do HD
  const updateHDConnection = useCallback(async (id: string, connected: boolean): Promise<boolean> => {
    try {
      if (isElectron && electronAPI.db) {
        // Atualizar no banco de dados
        const result = await electronAPI.db.updateHDConnection(id, connected);
        if (result.success) {
          await refreshData();
          return true;
        } else {
          toast({
            title: "Erro ao atualizar status de conexão",
            description: result.error,
            variant: "destructive",
          });
          return false;
        }
      } else {
        // Fallback para localStorage
        const currentHDs = JSON.parse(localStorage.getItem("hds") || "[]");
        const newHDs = currentHDs.map((h: HD) => 
          h.id === id ? { ...h, connected } : h
        );
        localStorage.setItem("hds", JSON.stringify(newHDs));
        setHDs(newHDs);
        return true;
      }
    } catch (err: any) {
      console.error("Erro ao atualizar status de conexão do HD:", err);
      toast({
        title: "Erro ao atualizar status de conexão",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast, refreshData]);

  return {
    loading,
    error,
    series,
    getSeries,
    saveSeries,
    deleteSeries,
    updateSeriesVisibility,
    hds,
    getHD,
    saveHD,
    deleteHD,
    updateHDConnection,
    refreshData,
  };
} 
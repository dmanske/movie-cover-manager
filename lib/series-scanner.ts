import { electronAPI, isElectron } from "@/lib/electron-bridge";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { extractMediaMetadata, estimateVideoDuration } from "@/lib/media-detector";
import type { Series, Season, Episode } from "@/lib/types";

// Padrões para detecção de séries e episódios
const SEASON_PATTERNS = [
  /^[sS](\d{1,2})$/,                  // S1, S01
  /^[sS]eason\s*(\d{1,2})$/i,         // Season 1, Season 01
  /^[tT]emporada\s*(\d{1,2})$/i,      // Temporada 1, Temporada 01
  /^(\d{1,2})(ª|st|nd|rd|th)?\s*[tT]emp(orada)?$/i, // 1ª Temporada, 1 Temp
  /^(\d{1,2})(ª|st|nd|rd|th)?\s*[sS]eason$/i,       // 1ª Season, 1st Season
  /^(\d{1,2})$/                       // Somente o número da temporada
];

const EPISODE_PATTERNS = [
  /[sS](\d+)[eE](\d+)/,              // S01E01, s01e01
  /[eE]pisod[eio]\s*(\d+)/i,         // Episodio 1, Episódio 1
  /[eE]p\s*(\d+)/i,                  // Ep 1, EP 1
  /\b(\d{1,2})[xX](\d{1,2})\b/,      // 1x01
  /\[(\d{1,2})[\s_.-]*(\d{1,2})\]/,  // [1 01], [1.01]
  /\s(\d{1,2})[\s_.-]*(\d{1,2})\b/,  // 1 01, 1.01
  /^(\d{1,2})[\s_.-]*(\d{1,2})\b/,   // 1.01, 1-01 no início do nome
  /Episódio (\d{1,2})/i              // "Episódio 1"
];

const VIDEO_EXTENSIONS = [
  '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.mpg', '.mpeg', '.m4v', '.3gp', '.webm'
];

interface SeriesScanResult {
  success: boolean;
  series: Series[];
  error?: string;
  lastProgress?: {
    message: string;
    percentage: number;
  };
}

/**
 * Verifica se um arquivo é um arquivo de vídeo baseado na extensão
 */
export function isVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

/**
 * Extrai o título da série do nome do diretório
 */
export function extractSeriesTitle(dirName: string): string {
  // Remover extensões de arquivo
  let title = path.parse(dirName).name;
  
  // Remover sufixos como (2020), [720p], etc.
  title = title.replace(/\([^)]*\)|\[[^\]]*\]|{[^}]*}/g, '');
  
  // Remover caracteres especiais e substituir por espaços
  title = title.replace(/[._\-]/g, ' ');
  
  // Remover marcadores de qualidade e codecs
  title = title.replace(/\b(720p|1080p|4k|uhd|webdl|web-dl|x264|h264|x265|hevc|dts|aac|ac3)\b/gi, '');
  
  // Remover espaços extras
  title = title.replace(/\s+/g, ' ').trim();
  
  return title;
}

/**
 * Verifica se uma pasta parece ser uma temporada e extrai seu número
 */
export function isSeasonFolder(name: string): { isSeason: boolean; seasonNumber: number } {
  for (const pattern of SEASON_PATTERNS) {
    const match = name.match(pattern);
    if (match) {
      return { isSeason: true, seasonNumber: parseInt(match[1], 10) };
    }
  }
  
  return { isSeason: false, seasonNumber: -1 };
}

/**
 * Verifica se um arquivo parece ser um episódio e extrai informações
 */
export function isEpisodeFile(name: string): { 
  isEpisode: boolean; 
  episodeNumber: number;
  seasonNumber?: number;
} {
  // Verificar se o nome do arquivo contém algum dos padrões
  for (const pattern of EPISODE_PATTERNS) {
    const match = name.match(pattern);
    if (match) {
      // Se o padrão tem dois grupos (temporada + episódio)
      if (match.length > 2) {
        return { 
          isEpisode: true, 
          seasonNumber: parseInt(match[1], 10),
          episodeNumber: parseInt(match[2], 10) 
        };
      } else {
        // Se o padrão tem apenas o número do episódio
        return { 
          isEpisode: true, 
          episodeNumber: parseInt(match[1], 10) 
        };
      }
    }
  }
  
  // Verificar se o nome do arquivo contém um número isolado
  const numberMatch = path.parse(name).name.match(/^(\d+)$/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    if (num > 0 && num < 100) { // Assumir que números entre 1 e 99 podem ser episódios
      return { isEpisode: true, episodeNumber: num };
    }
  }
  
  return { isEpisode: false, episodeNumber: -1 };
}

/**
 * Classe para escanear séries em HDs/diretórios
 */
export class SeriesScanner {
  private onProgress?: (message: string, percentage: number) => void;
  
  constructor() {}
  
  /**
   * Define callback para progresso de escaneamento
   */
  setProgressCallback(callback: (message: string, percentage: number) => void) {
    this.onProgress = callback;
  }
  
  /**
   * Reporta progresso do escaneamento
   */
  private reportProgress(message: string, percentage: number = -1) {
    if (this.onProgress) {
      this.onProgress(message, percentage);
    }
    console.log(`[SeriesScanner] ${message} ${percentage > -1 ? `(${percentage}%)` : ''}`);
  }
  
  /**
   * Escaneia um diretório/HD em busca de séries
   */
  async scanDirectory(directoryPath: string, apiKey: string, forceRescan: boolean = false): Promise<SeriesScanResult> {
    try {
      this.reportProgress(`Iniciando escaneamento de: ${directoryPath}`, 0);
      
      // Verificar se estamos no Electron
      if (!isElectron || !electronAPI.scanDriveForSeries) {
        this.reportProgress("Usando modo de simulação (não-Electron)", 10);
        return this.simulateScan(directoryPath, apiKey);
      }
      
      // Usar a API do Electron para escanear o diretório
      const result = await electronAPI.scanDriveForSeries(directoryPath, apiKey, forceRescan);
      
      if (!result.success) {
        throw new Error(result.error || "Erro desconhecido durante escaneamento");
      }
      
      this.reportProgress("Processando dados das séries encontradas...", 70);
      
      // Converter resultados do escaneamento para objetos Series
      const series: Series[] = await this.convertScanResultsToSeries(result.seriesFound, directoryPath);
      
      // Relatar conclusão
      const message = `Escaneamento concluído. Encontradas ${series.length} séries.`;
      this.reportProgress(message, 100);
      
      return {
        success: true,
        series,
        lastProgress: {
          message,
          percentage: 100
        }
      };
    } catch (error: any) {
      const errorMessage = `Erro ao escanear diretório: ${error.message}`;
      this.reportProgress(errorMessage, -1);
      
      return {
        success: false,
        series: [],
        error: errorMessage,
        lastProgress: {
          message: errorMessage,
          percentage: -1
        }
      };
    }
  }
  
  /**
   * Simula um escaneamento quando não estamos no Electron
   */
  private async simulateScan(directoryPath: string, apiKey: string): Promise<SeriesScanResult> {
    if (electronAPI.scanDriveForSeries) {
      // Se há uma implementação simulada disponível na ponte Electron
      const result = await electronAPI.scanDriveForSeries(directoryPath, apiKey, false);
      
      if (result.success) {
        const series = await this.convertScanResultsToSeries(result.seriesFound, directoryPath);
        return {
          success: true,
          series,
          lastProgress: result.lastProgress
        };
      } else {
        return {
          success: false,
          series: [],
          error: result.error || "Erro na simulação",
          lastProgress: result.lastProgress
        };
      }
    }
    
    // Criação de dados simulados
    this.reportProgress("Simulando escaneamento de séries...", 20);
    await this.simulateDelay(500);
    
    this.reportProgress("Analisando arquivos de vídeo...", 40);
    await this.simulateDelay(500);
    
    this.reportProgress("Organizando séries e temporadas...", 60);
    await this.simulateDelay(500);
    
    this.reportProgress("Buscando metadados...", 80);
    await this.simulateDelay(500);
    
    // Retornar algumas séries simuladas
    const seriesFound = [
      this.createSampleSeries("Breaking Bad", directoryPath, 5, 62),
      this.createSampleSeries("Stranger Things", directoryPath, 4, 34),
      this.createSampleSeries("The Boys", directoryPath, 3, 24)
    ];
    
    this.reportProgress("Escaneamento concluído", 100);
    
    return {
      success: true,
      series: seriesFound,
      lastProgress: {
        message: `Escaneamento concluído. Encontradas ${seriesFound.length} séries.`,
        percentage: 100
      }
    };
  }
  
  /**
   * Auxiliar: cria uma série de amostra para simulação
   */
  private createSampleSeries(title: string, basePath: string, numSeasons: number, totalEpisodes: number): Series {
    const hdId = "simulated_hd"; // Seria o ID real do HD no caso real
    const series: Series = {
      id: uuidv4(),
      title,
      hdId,
      hdPath: path.join(basePath, title.replace(/\s+/g, '.')),
      hidden: false,
      poster: `https://via.placeholder.com/500x750.png?text=${encodeURIComponent(title)}`,
      seasons: [],
      synopsis: `Descrição simulada para ${title}`,
      genres: ["Drama", "Action"],
      year: "2020-2023",
      creator: "Criador Simulado",
      totalWatchTime: 0,
      watched: false
    };
    
    // Distribuir episódios entre temporadas
    const episodesPerSeason = Math.ceil(totalEpisodes / numSeasons);
    let remainingEpisodes = totalEpisodes;
    
    for (let s = 1; s <= numSeasons; s++) {
      const season: Season = {
        number: s,
        totalEpisodes: Math.min(episodesPerSeason, remainingEpisodes),
        availableEpisodes: Math.min(episodesPerSeason, remainingEpisodes),
        episodes: [],
        poster: `https://via.placeholder.com/500x750.png?text=${encodeURIComponent(title)}_S${s}`
      };
      
      // Criar episódios para esta temporada
      for (let e = 1; e <= season.totalEpisodes; e++) {
        const episode: Episode = {
          number: e,
          title: `Episódio ${e}`,
          titlePt: `Episódio ${e} (PT)`,
          filename: `S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')}.mp4`,
          path: path.join(series.hdPath || "", `Temporada ${s}`, `S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')}.mp4`),
          duration: 45, // Duração média em minutos
          watched: false,
          synopsis: `Sinopse do episódio ${e} da temporada ${s}`,
          imdbRating: 7.5 + (Math.random() * 2 - 1), // Rating entre 6.5 e 9.5
          releaseDate: `2020-${String(s).padStart(2, '0')}-${String(e).padStart(2, '0')}`
        };
        
        season.episodes.push(episode);
        remainingEpisodes--;
      }
      
      series.seasons.push(season);
    }
    
    return series;
  }
  
  /**
   * Auxiliar: simula um delay para operações assíncronas
   */
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Converte resultados do escaneamento no formato do Electron para objetos Series
   */
  private async convertScanResultsToSeries(
    seriesFound: any[], 
    basePath: string
  ): Promise<Series[]> {
    const result: Series[] = [];
    
    for (const seriesInfo of seriesFound) {
      try {
        // Criar o objeto Series básico
        const series: Series = {
          id: uuidv4(),
          title: seriesInfo.title,
          hdId: "temp_id", // Será substituído pelo ID real
          hdPath: seriesInfo.path,
          hidden: false,
          poster: seriesInfo.posterPath || `https://via.placeholder.com/500x750.png?text=${encodeURIComponent(seriesInfo.title)}`,
          seasons: [],
          synopsis: "",
          genres: [],
          year: seriesInfo.year || "",
          imdbId: seriesInfo.imdbId,
          totalWatchTime: 0,
          watched: false
        };
        
        // Processar temporadas e episódios
        let totalDuration = 0;
        
        for (const seasonInfo of seriesInfo.seasons) {
          const season: Season = {
            number: seasonInfo.season,
            totalEpisodes: seasonInfo.episodes.length,
            availableEpisodes: seasonInfo.episodes.length,
            episodes: [],
            poster: "" // Será preenchido posteriormente
          };
          
          // Processar episódios da temporada
          for (const episodeInfo of seasonInfo.episodes) {
            // Estimar informações de cada episódio
            const filePath = episodeInfo.path;
            const fileName = episodeInfo.filename || path.basename(filePath);
            
            // Obter informações do arquivo, se possível
            let fileSize = 0;
            if (isElectron && electronAPI.getFileSize) {
              try {
                const fileSizeResult = await electronAPI.getFileSize(filePath);
                if (fileSizeResult.success) {
                  fileSize = fileSizeResult.size;
                }
              } catch (e) {
                console.error("Erro ao obter tamanho do arquivo:", e);
              }
            } else {
              // Tamanho simulado
              fileSize = 1024 * 1024 * 1024 * (Math.random() * 3 + 0.5); // 0.5 a 3.5 GB
            }
            
            // Extrair metadados do nome do arquivo
            const metadata = extractMediaMetadata(fileName, fileSize);
            
            // Estimar duração se não estiver disponível
            const estimatedDuration = estimateVideoDuration(fileSize, metadata.quality.resolution);
            metadata.duration = estimatedDuration;
            
            // Criar objeto de episódio
            const episode: Episode = {
              number: episodeInfo.episode,
              title: `Episódio ${episodeInfo.episode}`, // Título padrão
              titlePt: `Episódio ${episodeInfo.episode}`, // Mesmo título em português
              filename: fileName,
              path: filePath,
              duration: estimatedDuration,
              watched: false,
              synopsis: "", // Será preenchido com metadados se disponíveis
              imdbRating: 0, // Será preenchido com metadados se disponíveis
              releaseDate: ""
            };
            
            // Adicionar episódio à temporada
            season.episodes.push(episode);
            totalDuration += estimatedDuration;
          }
          
          // Ordenar episódios por número
          season.episodes.sort((a, b) => a.number - b.number);
          
          // Adicionar temporada à série
          series.seasons.push(season);
        }
        
        // Ordenar temporadas por número
        series.seasons.sort((a, b) => a.number - b.number);
        
        // Registrar tempo total estimado
        series.totalWatchTime = totalDuration;
        
        // Adicionar série ao resultado
        result.push(series);
      } catch (error) {
        console.error(`Erro ao processar série ${seriesInfo.title}:`, error);
      }
    }
    
    return result;
  }
} 
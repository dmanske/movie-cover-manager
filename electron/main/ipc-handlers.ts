import { ipcMain, dialog, app, shell } from "electron"
import fs from "fs"
import path from "path"
import os from "os"
import { promisify } from "util"
import https from "https"
import http from "http"
import crypto from "crypto"
import { db } from './database'

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const mkdir = promisify(fs.mkdir)
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

interface FileInfo {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: Date
}

interface SeriesInfo {
  title: string
  path: string
  seasons: {
    season: number
    episodes: {
      episode: number
      path: string
      filename: string
    }[]
  }[]
  posterPath?: string
  backdropPath?: string
  year?: string
  imdbId?: string
}

// Extensões de arquivos de vídeo comuns
const VIDEO_EXTENSIONS = [
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp'
];

// Sistema de cache para escaneamentos de séries
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
const scanCache = new Map<string, { timestamp: number, result: any }>();

// Função para calcular hash de diretório (usado como chave de cache)
function calculateDirectoryHash(dirPath: string): string {
  return crypto.createHash('md5').update(dirPath).digest('hex');
}

// Função para verificar se o cache é válido
function isCacheValid(cachePath: string): boolean {
  if (!scanCache.has(cachePath)) return false;
  
  const cache = scanCache.get(cachePath)!;
  const now = Date.now();
  
  return (now - cache.timestamp) < CACHE_DURATION;
}

// Função para salvar resultado no cache
function saveScanToCache(dirPath: string, result: any): void {
  const cacheKey = calculateDirectoryHash(dirPath);
  scanCache.set(cacheKey, {
    timestamp: Date.now(),
    result: result
  });
  
  // Salvar cache em disco para persistir entre sessões
  try {
    const cacheDirPath = path.join(app.getPath('userData'), 'scan-cache');
    if (!fs.existsSync(cacheDirPath)) {
      fs.mkdirSync(cacheDirPath, { recursive: true });
    }
    
    const cacheFilePath = path.join(cacheDirPath, `${cacheKey}.json`);
    fs.writeFileSync(cacheFilePath, JSON.stringify({
      path: dirPath,
      timestamp: Date.now(),
      result: result
    }));
  } catch (error) {
    console.error('Erro ao salvar cache em disco:', error);
  }
}

// Função para carregar cache de escaneamento
function loadScanFromCache(dirPath: string): any | null {
  const cacheKey = calculateDirectoryHash(dirPath);
  
  // Verificar cache em memória primeiro
  if (isCacheValid(cacheKey)) {
    return scanCache.get(cacheKey)!.result;
  }
  
  // Verificar cache em disco
  try {
    const cacheFilePath = path.join(app.getPath('userData'), 'scan-cache', `${cacheKey}.json`);
    if (fs.existsSync(cacheFilePath)) {
      const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
      
      // Verificar se o cache ainda é válido
      if ((Date.now() - cacheData.timestamp) < CACHE_DURATION) {
        // Armazenar em memória para acessos futuros
        scanCache.set(cacheKey, {
          timestamp: cacheData.timestamp,
          result: cacheData.result
        });
        
        return cacheData.result;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar cache de disco:', error);
  }
  
  return null;
}

// Inicializar os manipuladores IPC
export function setupIpcHandlers() {
  console.log("Configurando handlers IPC para operações de arquivo")

  // Listar conteúdo de um diretório
  ipcMain.handle("explore-directory", async (_, directoryPath: string) => {
    try {
      console.log(`Explorando diretório: ${directoryPath}`)
      // Verificar se o diretório existe
      if (!fs.existsSync(directoryPath)) {
        throw new Error(`Diretório não existe: ${directoryPath}`)
      }

      // Ler o conteúdo do diretório
      const files = await readdir(directoryPath)
      
      // Obter informações de cada arquivo/pasta
      const filesInfo: FileInfo[] = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(directoryPath, file)
          try {
            const stats = await stat(filePath)
            return {
              name: file,
              path: filePath,
              isDirectory: stats.isDirectory(),
              size: stats.size,
              modified: stats.mtime,
            }
          } catch (error) {
            console.error(`Erro ao ler informações do arquivo ${filePath}:`, error)
            // Retornar informações mínimas para não quebrar o processamento
            return {
              name: file,
              path: filePath,
              isDirectory: false,
              size: 0,
              modified: new Date(),
            }
          }
        })
      )

      // Ordenar: primeiro diretórios, depois arquivos, ambos em ordem alfabética
      return filesInfo.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
    } catch (error) {
      console.error("Erro ao explorar diretório:", error)
      throw error
    }
  })

  // Verificar se um arquivo é um vídeo
  const isVideoFile = (filePath: string): boolean => {
    const ext = path.extname(filePath).toLowerCase();
    return VIDEO_EXTENSIONS.includes(ext);
  };

  // Função para extrair o título da série a partir do nome do diretório ou arquivo
  const extractSeriesTitle = (name: string): string => {
    // Remover extensão se for um arquivo
    let title = path.parse(name).name;
    
    // Remover padrões comuns como S01E01, temporada 1, etc.
    title = title.replace(/s\d{1,2}e\d{1,2}/i, ''); // Remove S01E01
    title = title.replace(/temporada\s*\d+/i, ''); // Remove "Temporada 1"
    title = title.replace(/season\s*\d+/i, ''); // Remove "Season 1"
    title = title.replace(/\[.*?\]/g, ''); // Remove qualquer coisa entre colchetes
    title = title.replace(/\(.*?\)/g, ''); // Remove qualquer coisa entre parênteses
    title = title.replace(/\d{3,4}p/i, ''); // Remove resolução como 720p, 1080p
    title = title.replace(/bluray|brrip|dvdrip|webrip|web-dl|hdtv/i, ''); // Remove termos comuns de qualidade
    title = title.replace(/complete|completo/i, ''); // Remove palavras como "completo"
    title = title.replace(/dual audio|legendado|dublado/i, ''); // Remove termos de idioma
    title = title.replace(/\d+\s*-\s*\d+/g, ''); // Remove padrões como "1-10" (episódios)
    
    // Limpar espaços extras e pontuação no final
    title = title.replace(/[._-]/g, ' '); // Substitui pontos, underscores e hífens por espaços
    title = title.replace(/\s+/g, ' '); // Remove espaços extras
    title = title.trim(); // Remove espaços no início e fim
    
    // Se for apenas uma palavra ou números, tenta manter mais do nome original
    if (/^\w+$/.test(title) || /^\d+$/.test(title)) {
      // Tenta usar mais do nome original quando o algoritmo removeu muito
      title = path.parse(name).name;
      title = title.replace(/[._-]/g, ' ').trim();
    }
    
    return title;
  };

  // Verificar se um nome de arquivo/pasta parece uma temporada
  const isSeasonFolder = (name: string): { isSeason: boolean, seasonNumber: number } => {
    // Padrões comuns para pastas de temporada
    const patterns = [
      /^temporada\s*(\d+)$/i,             // "Temporada 1"
      /^temp\s*(\d+)$/i,                  // "Temp 1"
      /^season\s*(\d+)$/i,                // "Season 1"
      /^s(\d+)$/i,                        // "S1"
      /^(\d+)[\s_.-]*temporada$/i,        // "1 Temporada"
      /^(\d+)[\s_.-]*temp$/i,             // "1 Temp"
      /^(\d+)[\s_.-]*season$/i,           // "1 Season"
      /^(\d+)ª?[\s_.-]*temporada$/i       // "1ª Temporada"
    ];
    
    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match) {
        return { isSeason: true, seasonNumber: parseInt(match[1], 10) };
      }
    }
    
    return { isSeason: false, seasonNumber: -1 };
  };

  // Verificar se um nome de arquivo parece um episódio e extrair seu número
  const isEpisodeFile = (name: string): { isEpisode: boolean, episodeNumber: number } => {
    // Padrões comuns para nomes de episódios
    const patterns = [
      /[sS](\d+)[eE](\d+)/,              // S01E01, s01e01
      /[eE]pisod[eio]\s*(\d+)/i,         // Episodio 1, Episódio 1
      /[eE]p\s*(\d+)/i,                  // Ep 1, EP 1
      /\b(\d{1,2})[xX](\d{1,2})\b/,      // 1x01
      /\[(\d{1,2})[\s_.-]*(\d{1,2})\]/,  // [1 01], [1.01]
      /\s(\d{1,2})[\s_.-]*(\d{1,2})\b/,  // 1 01, 1.01
      /^(\d{1,2})[\s_.-]*(\d{1,2})\b/,   // 1.01, 1-01 no início do nome
      /Episódio (\d{1,2})/i              // "Episódio 1"
    ];
    
    // Verificar se o nome do arquivo contém algum dos padrões
    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match) {
        // Se o padrão tem dois grupos (temporada + episódio), usamos o segundo grupo
        const epNumber = match.length > 2 ? parseInt(match[2], 10) : parseInt(match[1], 10);
        return { isEpisode: true, episodeNumber: epNumber };
      }
    }
    
    // Se não encontrou um padrão conhecido, verificar se o nome do arquivo contém um número isolado
    // que pode ser um número de episódio
    const numberMatch = path.parse(name).name.match(/^(\d+)$/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1], 10);
      if (num > 0 && num < 100) { // Assume que números entre 1 e 99 podem ser episódios
        return { isEpisode: true, episodeNumber: num };
      }
    }
    
    return { isEpisode: false, episodeNumber: -1 };
  };

  // Função para criar o diretório de capas se não existir
  const ensureImageDir = async () => {
    const imagesDir = path.join(app.getPath('userData'), 'images');
    try {
      if (!fs.existsSync(imagesDir)) {
        await mkdir(imagesDir, { recursive: true });
      }
      return imagesDir;
    } catch (error) {
      console.error('Erro ao criar diretório de imagens:', error);
      throw error;
    }
  };

  // Função para baixar uma imagem a partir de uma URL
  const downloadImage = async (url: string, imdbId: string, type: 'poster' | 'backdrop'): Promise<string> => {
    try {
      // Criar diretório para imagens se não existir
      const imagesDir = await ensureImageDir();
      
      // Definir o caminho para salvar a imagem
      const imageFilename = `${imdbId}_${type}.jpg`;
      const imagePath = path.join(imagesDir, imageFilename);
      
      // Verificar se a imagem já existe
      if (fs.existsSync(imagePath)) {
        console.log(`Imagem já existe: ${imagePath}`);
        return imagePath;
      }
      
      console.log(`Baixando imagem de ${url} para ${imagePath}`);
      
      // Criar um stream de escrita
      const file = fs.createWriteStream(imagePath);
      
      // Escolher http ou https dependendo da URL
      const httpClient = url.startsWith('https://') ? https : http;
      
      // Retornar uma promessa que resolve quando o download for concluído
      return new Promise((resolve, reject) => {
        const request = httpClient.get(url, (response) => {
          // Verificar o status da resposta
          if (response.statusCode !== 200) {
            reject(new Error(`Falha ao baixar imagem: ${response.statusCode} ${response.statusMessage}`));
            return;
          }
          
          // Pipe da resposta para o arquivo
          response.pipe(file);
          
          // Quando o download for concluído
          file.on('finish', () => {
            file.close();
            resolve(imagePath);
          });
        });
        
        // Lidar com erros
        request.on('error', (err) => {
          fs.unlink(imagePath, () => {}); // Limpar o arquivo parcial
          reject(err);
        });
        
        file.on('error', (err) => {
          fs.unlink(imagePath, () => {}); // Limpar o arquivo parcial
          reject(err);
        });
      });
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      throw error;
    }
  };

  // Função para buscar informações de série no IMDB e baixar imagens
  const fetchSeriesInfoFromImdb = async (title: string, apiKey: string, year?: string): Promise<{
    imdbId: string;
    title: string;
    year: string;
    posterPath?: string;
    backdropPath?: string;
  } | null> => {
    try {
      console.log(`Buscando informações para: ${title} ${year || ''}`);
      
      // Construir a URL de busca, adicionando o ano se disponível
      let searchQuery = encodeURIComponent(title);
      if (year) {
        searchQuery += `&y=${encodeURIComponent(year)}`;
      }
      
      // URL da API do IMDB (assumindo que você está usando a OMDB API)
      const searchUrl = `http://www.omdbapi.com/?apikey=${apiKey}&t=${searchQuery}&type=series`;
      
      // Fazer a requisição HTTP
      const responseData = await new Promise<any>((resolve, reject) => {
        const httpClient = searchUrl.startsWith('https://') ? https : http;
        
        httpClient.get(searchUrl, (response) => {
          let data = '';
          
          // Receber os chunks de dados
          response.on('data', (chunk) => {
            data += chunk;
          });
          
          // Quando a resposta estiver completa
          response.on('end', () => {
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.Response === "True") {
                resolve(parsedData);
              } else {
                console.error('Erro na resposta da API:', parsedData.Error);
                resolve(null);
              }
            } catch (e: any) {
              reject(new Error(`Erro ao analisar resposta da API: ${e.message}`));
            }
          });
        }).on('error', (err) => {
          reject(new Error(`Erro na requisição para IMDB: ${err.message}`));
        });
      });
      
      // Se não encontrou nenhum resultado
      if (!responseData) {
        console.log(`Nenhum resultado encontrado para: ${title}`);
        return null;
      }
      
      const seriesInfo: {
        imdbId: string;
        title: string;
        year: string;
        posterPath?: string;
        backdropPath?: string;
      } = {
        imdbId: responseData.imdbID,
        title: responseData.Title,
        year: responseData.Year,
        posterPath: undefined,
        backdropPath: undefined
      };
      
      // Se tiver poster, baixar e salvar
      if (responseData.Poster && responseData.Poster !== 'N/A') {
        try {
          const posterPath = await downloadImage(responseData.Poster, seriesInfo.imdbId, 'poster');
          seriesInfo.posterPath = posterPath;
        } catch (error) {
          console.error(`Erro ao baixar poster para ${title}:`, error);
        }
      }
      
      // Nota: OMDB API não fornece backdrops, você teria que usar outra API como TMDB
      // Como workaround, estamos apenas retornando o que temos
      
      return seriesInfo;
    } catch (error) {
      console.error(`Erro ao buscar informações para ${title}:`, error);
      return null;
    }
  };

  // Escanear um diretório buscando séries
  const scanForSeries = async (
    directoryPath: string,
    apiKey: string,
    progressCallback: (message: string, percentage: number) => void,
    foundSeriesCallback: (series: SeriesInfo) => void
  ): Promise<void> => {
    try {
      progressCallback(`Iniciando escaneamento de ${directoryPath}...`, 0);
      
      // Conjunto para armazenar séries encontradas (evita duplicações)
      const foundSeries = new Map<string, SeriesInfo>();
      const processedPaths = new Set<string>(); // Evitar processamento duplicado
      
      // Função recursiva para explorar diretórios
      const exploreDir = async (dirPath: string, depth = 0): Promise<void> => {
        try {
          // Evitar processar o mesmo diretório várias vezes
          if (processedPaths.has(dirPath)) return;
          processedPaths.add(dirPath);
          
          // Limitar a profundidade para evitar loops infinitos
          if (depth > 10) {
            return;
          }
          
          // Lista todos os arquivos e diretórios
          const items = await readdir(dirPath);
          
          // Verifica se este diretório tem arquivos de vídeo, sem subdiretórios de temporadas
          let videoFiles = 0;
          let hasSeasonDirs = false;
          
          // Primeiro passo: verificar o conteúdo do diretório atual
          for (const item of items) {
            const itemPath = path.join(dirPath, item);
            try {
              const stats = await stat(itemPath);
              if (stats.isDirectory()) {
                const { isSeason } = isSeasonFolder(item);
                if (isSeason) {
                  hasSeasonDirs = true;
                }
              } else if (isVideoFile(itemPath)) {
                const { isEpisode } = isEpisodeFile(item);
                if (isEpisode) {
                  videoFiles++;
                }
              }
            } catch (error: any) {
              console.error(`Erro ao verificar ${itemPath}:`, error);
            }
          }
          
          // Se temos arquivos de vídeo e não temos pastas de temporadas, 
          // tratar este diretório como uma série com uma única temporada
          if (videoFiles > 0 && !hasSeasonDirs) {
            const dirName = path.basename(dirPath);
            const seriesTitle = extractSeriesTitle(dirName);
            
            if (!foundSeries.has(dirPath)) {
              foundSeries.set(dirPath, {
                title: seriesTitle,
                path: dirPath,
                seasons: [{
                  season: 1,
                  episodes: []
                }]
              });
              
              // Informa o progresso
              progressCallback(`Encontrada série: ${seriesTitle}`, -1);
            }
            
            // Adicionar todos os arquivos de vídeo como episódios da temporada 1
            const series = foundSeries.get(dirPath)!;
            let season = series.seasons[0];
            let episodeCount = 0;
            
            for (const item of items) {
              const itemPath = path.join(dirPath, item);
              try {
                const stats = await stat(itemPath);
                if (!stats.isDirectory() && isVideoFile(itemPath)) {
                  const { isEpisode, episodeNumber } = isEpisodeFile(item);
                  
                  episodeCount++;
                  
                  if (isEpisode && episodeNumber > 0) {
                    // Verifica se o episódio já existe
                    if (!season.episodes.some((e: { episode: number }) => e.episode === episodeNumber)) {
                      season.episodes.push({
                        episode: episodeNumber,
                        path: itemPath,
                        filename: item
                      });
                    }
                  } else {
                    // Se não conseguimos extrair um número de episódio, usar um contador incremental
                    const nextEpisodeNumber = season.episodes.length + 1;
                    season.episodes.push({
                      episode: nextEpisodeNumber,
                      path: itemPath,
                      filename: item
                    });
                  }
                }
              } catch (error: any) {
                console.error(`Erro ao processar arquivo ${itemPath}:`, error);
              }
            }
            
            // Registrar quantidade total de episódios encontrados
            console.log(`Encontrados ${episodeCount} arquivos de vídeo em ${dirPath} - série ${seriesTitle}`);
          } else {
            // Para cada item no diretório
            for (const item of items) {
              const itemPath = path.join(dirPath, item);
              
              try {
                const stats = await stat(itemPath);
                
                if (stats.isDirectory()) {
                  // Verificar se o diretório parece uma temporada
                  const { isSeason, seasonNumber } = isSeasonFolder(item);
                  
                  if (isSeason) {
                    // Obtém o diretório pai, que deve ser a série
                    const seriesPath = path.dirname(itemPath);
                    const seriesName = path.basename(seriesPath);
                    const seriesTitle = extractSeriesTitle(seriesName);
                    
                    // Adiciona ou atualiza informações da série
                    if (!foundSeries.has(seriesPath)) {
                      foundSeries.set(seriesPath, {
                        title: seriesTitle,
                        path: seriesPath,
                        seasons: []
                      });
                      
                      // Informa o progresso
                      progressCallback(`Encontrada série: ${seriesTitle}`, -1);
                    }
                    
                    // Referência para a série
                    const series = foundSeries.get(seriesPath)!;
                    
                    // Verifica se a temporada já existe
                    let season = series.seasons.find(s => s.season === seasonNumber);
                    if (!season) {
                      season = { season: seasonNumber, episodes: [] };
                      series.seasons.push(season);
                    }
                    
                    // Escaneia os episódios na pasta da temporada
                    const seasonItems = await readdir(itemPath);
                    let episodeCount = 0;
                    
                    for (const episodeItem of seasonItems) {
                      const episodePath = path.join(itemPath, episodeItem);
                      const episodeStats = await stat(episodePath);
                      
                      if (!episodeStats.isDirectory() && isVideoFile(episodePath)) {
                        episodeCount++;
                        
                        // Verificar se parece um episódio
                        const { isEpisode, episodeNumber } = isEpisodeFile(episodeItem);
                        
                        if (isEpisode && episodeNumber > 0) {
                          // Evitar adicionar duplicados
                          if (!season.episodes.some(e => e.episode === episodeNumber)) {
                            season.episodes.push({
                              episode: episodeNumber,
                              path: episodePath,
                              filename: episodeItem
                            });
                          }
                        }
                      }
                    }
                    
                    // Registrar quantidade de episódios encontrados
                    console.log(`Encontrados ${episodeCount} episódios na temporada ${seasonNumber} de ${seriesTitle}`);
                  } else {
                    // Se não é uma temporada, continua explorando recursivamente
                    await exploreDir(itemPath, depth + 1);
                  }
                } else if (isVideoFile(itemPath)) {
                  // É um arquivo de vídeo, pode ser um episódio único ou um filme
                  // Verificar se parece um episódio
                  const { isEpisode, episodeNumber } = isEpisodeFile(item);
                  
                  if (isEpisode) {
                    // Obtém o diretório pai
                    const parentDir = path.dirname(itemPath);
                    const parentName = path.basename(parentDir);
                    
                    // Verifica se o pai parece uma temporada
                    const { isSeason, seasonNumber } = isSeasonFolder(parentName);
                    
                    if (isSeason) {
                      // O pai é uma temporada, então o avô deve ser a série
                      const seriesPath = path.dirname(parentDir);
                      const seriesName = path.basename(seriesPath);
                      const seriesTitle = extractSeriesTitle(seriesName);
                      
                      // Adiciona ou atualiza informações da série
                      if (!foundSeries.has(seriesPath)) {
                        foundSeries.set(seriesPath, {
                          title: seriesTitle,
                          path: seriesPath,
                          seasons: []
                        });
                        
                        // Informa o progresso
                        progressCallback(`Encontrada série: ${seriesTitle}`, -1);
                      }
                      
                      // Referência para a série
                      const series = foundSeries.get(seriesPath)!;
                      
                      // Verifica se a temporada já existe
                      let season = series.seasons.find(s => s.season === seasonNumber);
                      if (!season) {
                        season = { season: seasonNumber, episodes: [] };
                        series.seasons.push(season);
                      }
                      
                      // Adiciona o episódio se ainda não existir
                      if (!season.episodes.some(e => e.episode === episodeNumber)) {
                        season.episodes.push({
                          episode: episodeNumber,
                          path: itemPath,
                          filename: item
                        });
                      }
                    } else {
                      // Se o pai não é uma temporada, pode ser a própria série
                      const seriesTitle = extractSeriesTitle(parentName);
                      
                      // Adiciona ou atualiza informações da série
                      if (!foundSeries.has(parentDir)) {
                        foundSeries.set(parentDir, {
                          title: seriesTitle,
                          path: parentDir,
                          seasons: []
                        });
                        
                        // Informa o progresso
                        progressCallback(`Encontrada série: ${seriesTitle}`, -1);
                      }
                      
                      // Referência para a série
                      const series = foundSeries.get(parentDir)!;
                      
                      // Assumimos temporada 1 por padrão
                      let season = series.seasons.find(s => s.season === 1);
                      if (!season) {
                        season = { season: 1, episodes: [] };
                        series.seasons.push(season);
                      }
                      
                      // Adiciona o episódio se ainda não existir
                      if (!season.episodes.some(e => e.episode === episodeNumber)) {
                        season.episodes.push({
                          episode: episodeNumber,
                          path: itemPath,
                          filename: item
                        });
                      }
                    }
                  }
                }
              } catch (error: any) {
                console.error(`Erro ao processar ${itemPath}:`, error);
                continue; // Continua com o próximo item
              }
            }
          }
        } catch (error: any) {
          console.error(`Erro ao explorar diretório ${dirPath}:`, error);
        }
      };
      
      // Iniciar o escaneamento recursivo
      await exploreDir(directoryPath);
      
      // Ordenar as temporadas e episódios para cada série
      for (const [seriesPath, series] of foundSeries) {
        // Ordenar temporadas numericamente
        series.seasons.sort((a, b) => a.season - b.season);
        
        // Ordenar episódios numericamente em cada temporada
        for (const season of series.seasons) {
          season.episodes.sort((a, b) => a.episode - b.episode);
          console.log(`Série: ${series.title}, Temporada ${season.season}: ${season.episodes.length} episódios`);
        }
        
        // Registrar informações da série
        const totalSeasons = series.seasons.length;
        const totalEpisodes = series.seasons.reduce((sum, season) => sum + season.episodes.length, 0);
        console.log(`Série: ${series.title} - ${totalSeasons} temporadas, ${totalEpisodes} episódios`);
      }
      
      // Agora, para cada série encontrada, buscar informações e imagens
      let processedCount = 0;
      const totalSeries = foundSeries.size;
      
      for (const [_, series] of foundSeries) {
        try {
          // Informar progresso
          progressCallback(`Buscando informações para: ${series.title}`, (processedCount / totalSeries) * 100);
          
          // Extrair ano se estiver no título (formato comum: "Nome da Série (2021)")
          let year: string | undefined;
          const yearMatch = series.title.match(/\((\d{4})\)$/);
          if (yearMatch) {
            year = yearMatch[1];
          }
          
          // Buscar informações do IMDB
          const seriesInfo = await fetchSeriesInfoFromImdb(series.title, apiKey, year);
          
          if (seriesInfo) {
            // Atualizar informações da série
            series.imdbId = seriesInfo.imdbId;
            series.title = seriesInfo.title; // Usar o título correto do IMDB
            series.year = seriesInfo.year;
            series.posterPath = seriesInfo.posterPath;
            series.backdropPath = seriesInfo.backdropPath;
          }
          
          // Notificar a série encontrada com suas informações
          foundSeriesCallback(series);
          
        } catch (error) {
          console.error(`Erro ao obter informações para ${series.title}:`, error);
        }
        
        processedCount++;
      }
      
      // Escaneamento concluído
      progressCallback(`Escaneamento concluído. Encontradas ${totalSeries} séries.`, 100);
      
    } catch (error: any) {
      console.error("Erro no escaneamento:", error);
      progressCallback(`Erro no escaneamento: ${error.message}`, -1);
      throw error;
    }
  };

  // Handler para escanear um HD em busca de séries
  ipcMain.handle("scan-drive-for-series", async (_, drivePath: string, apiKey: string, forceRefresh: boolean = false) => {
    console.log(`Iniciando escaneamento do HD: ${drivePath}`);
    
    const seriesFound: SeriesInfo[] = [];
    let lastProgress = { message: "", percentage: 0 };
    
    try {
      // Verifica se o diretório existe
      if (!fs.existsSync(drivePath)) {
        throw new Error(`Caminho não existe: ${drivePath}`);
      }
      
      // Verificar cache, a menos que forceRefresh seja true
      if (!forceRefresh) {
        const cachedResult = loadScanFromCache(drivePath);
        if (cachedResult) {
          console.log(`Usando resultado em cache para ${drivePath}`);
          return cachedResult;
        }
      }
      
      // Inicia o escaneamento
      await scanForSeries(
        drivePath,
        apiKey,
        (message, percentage) => {
          // Callback de progresso
          lastProgress = { message, percentage };
        },
        (series) => {
          // Callback de série encontrada
          seriesFound.push(series);
        }
      );
      
      const result = {
        success: true,
        seriesFound,
        lastProgress
      };
      
      // Salvar resultado no cache
      saveScanToCache(drivePath, result);
      
      return result;
    } catch (error) {
      console.error("Erro ao escanear HD:", error);
      return {
        success: false,
        error: (error as any).message,
        seriesFound,
        lastProgress
      };
    }
  });

  // Abrir diálogo para selecionar diretório
  ipcMain.handle("select-directory", async () => {
    try {
      console.log("Abrindo diálogo para selecionar diretório")
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: "Selecionar Diretório",
      })

      if (result.canceled) {
        console.log("Seleção de diretório cancelada pelo usuário")
        return null
      }

      console.log(`Diretório selecionado: ${result.filePaths[0]}`)
      return result.filePaths[0]
    } catch (error) {
      console.error("Erro ao selecionar diretório:", error)
      throw error
    }
  })

  // Detectar unidades (HDs) disponíveis
  ipcMain.handle("detect-drives", async () => {
    try {
      console.log("Detectando unidades disponíveis")
      const drives: { letter: string; label: string; path: string; size: number; type: string }[] = []
      
      // Implementação específica por plataforma
      if (process.platform === "win32") {
        // No Windows, tentar listar as unidades de A a Z
        for (let i = 65; i <= 90; i++) {
          const driveLetter = String.fromCharCode(i)
          const drivePath = `${driveLetter}:`
          
          try {
            // Verificar se a unidade existe
            const stats = fs.statSync(`${drivePath}\\`)
            if (stats) {
              // Obter informações adicionais da unidade
              let label = ""
              let freeSpace = 0
              let totalSpace = 0
              let driveType = "unknown"
              
              try {
                // Aqui você pode usar outras APIs ou bibliotecas para obter
                // informações mais detalhadas sobre a unidade
                // Este é apenas um exemplo simplificado
                
                // Determinar o tipo de unidade
                if (driveLetter === "C") {
                  driveType = "internal"
                } else if (drivePath.startsWith("\\\\")) {
                  driveType = "network"
                } else {
                  driveType = "external"
                }
                
                // Adicionar a unidade à lista
                drives.push({
                  letter: driveLetter,
                  label: label || `Unidade (${driveLetter}:)`,
                  path: `${drivePath}\\`,
                  size: totalSpace,
                  type: driveType,
                })
              } catch (err) {
                console.error(`Erro ao obter detalhes da unidade ${drivePath}:`, err)
              }
            }
          } catch (err) {
            // Unidade não existe ou não está acessível, ignorar
          }
        }
      } else if (process.platform === "darwin" || process.platform === "linux") {
        // No macOS e Linux, listar montagens em /Volumes ou /mnt
        const mountDir = process.platform === "darwin" ? "/Volumes" : "/mnt"
        
        try {
          const mounts = await readdir(mountDir)
          for (const mount of mounts) {
            const mountPath = path.join(mountDir, mount)
            try {
              const stats = await stat(mountPath)
              if (stats.isDirectory()) {
                let driveType = "external"
                
                // No macOS, determinar se é interno ou externo
                if (process.platform === "darwin" && (mount === "Macintosh HD" || mount === "System")) {
                  driveType = "internal"
                }
                
                drives.push({
                  letter: "",
                  label: mount,
                  path: mountPath,
                  size: 0, // Precisaria de mais informações para determinar o tamanho
                  type: driveType,
                })
              }
            } catch (err) {
              console.error(`Erro ao verificar montagem ${mountPath}:`, err)
            }
          }
        } catch (err) {
          console.error(`Erro ao listar montagens em ${mountDir}:`, err)
        }
      }
      
      console.log(`Detectadas ${drives.length} unidades`)
      return drives
    } catch (error) {
      console.error("Erro ao detectar unidades:", error)
      throw error
    }
  })

  // Abrir arquivo com o aplicativo padrão do sistema
  ipcMain.handle("open-file", async (_, filePath: string) => {
    try {
      console.log(`Abrindo arquivo: ${filePath}`)
      await shell.openPath(filePath)
      return true
    } catch (error) {
      console.error("Erro ao abrir arquivo:", error)
      throw error
    }
  })

  // Verificar se um caminho existe
  ipcMain.handle("path-exists", (_, filePath: string) => {
    try {
      console.log(`Verificando se o caminho existe: ${filePath}`)
      return fs.existsSync(filePath)
    } catch (error) {
      console.error("Erro ao verificar caminho:", error)
      return false
    }
  })

  // Handler para identificar séries a partir de um diretório específico
  ipcMain.handle("identify-series-from-directory", async (_, directoryPath: string, apiKey: string) => {
    console.log(`Identificando série do diretório: ${directoryPath}`);
    
    try {
      // Verifica se o diretório existe
      if (!fs.existsSync(directoryPath)) {
        throw new Error(`Caminho não existe: ${directoryPath}`);
      }
      
      // Extrai o nome da série a partir do diretório
      const dirName = path.basename(directoryPath);
      const seriesTitle = extractSeriesTitle(dirName);
      
      console.log(`Extraído título: ${seriesTitle} do diretório: ${dirName}`);
      
      // Verifica a estrutura do diretório
      const items = await readdir(directoryPath);
      let seasons: {
        season: number;
        episodes: {
          episode: number;
          path: string;
          filename: string;
        }[];
      }[] = [];
      
      // Verificar se existem pastas de temporadas
      const seasonDirs = [];
      let videoFiles = [];
      
      for (const item of items) {
        const itemPath = path.join(directoryPath, item);
        try {
          const stats = await stat(itemPath);
          if (stats.isDirectory()) {
            const { isSeason, seasonNumber } = isSeasonFolder(item);
            if (isSeason) {
              seasonDirs.push({ name: item, path: itemPath, season: seasonNumber });
            } else {
              // Verificar se há pastas com nomes de temporadas dentro desta pasta
              const subItems = await readdir(itemPath);
              for (const subItem of subItems) {
                const subItemPath = path.join(itemPath, subItem);
                const subStats = await stat(subItemPath);
                if (subStats.isDirectory()) {
                  const subCheck = isSeasonFolder(subItem);
                  if (subCheck.isSeason) {
                    seasonDirs.push({
                      name: subItem,
                      path: subItemPath,
                      season: subCheck.seasonNumber
                    });
                  }
                }
              }
            }
          } else if (isVideoFile(itemPath)) {
            videoFiles.push({ name: item, path: itemPath });
          }
        } catch (error: any) {
          console.error(`Erro ao analisar item ${itemPath}:`, error);
        }
      }
      
      // Se encontramos pastas de temporadas, processe-as
      if (seasonDirs.length > 0) {
        console.log(`Encontradas ${seasonDirs.length} pastas de temporadas`);
        
        for (const seasonDir of seasonDirs) {
          const seasonItems = await readdir(seasonDir.path);
          const episodes = [];
          
          for (const episodeItem of seasonItems) {
            const episodePath = path.join(seasonDir.path, episodeItem);
            const episodeStats = await stat(episodePath);
            
            if (!episodeStats.isDirectory() && isVideoFile(episodePath)) {
              const { isEpisode, episodeNumber } = isEpisodeFile(episodeItem);
              
              if (isEpisode && episodeNumber > 0) {
                episodes.push({
                  episode: episodeNumber,
                  path: episodePath,
                  filename: episodeItem
                });
              }
            }
          }
          
          if (episodes.length > 0) {
            seasons.push({
              season: seasonDir.season,
              episodes: episodes
            });
          }
        }
      } else if (videoFiles.length > 0) {
        // Se não temos pastas de temporadas, mas temos arquivos de vídeo
        console.log(`Sem pastas de temporadas, mas encontrados ${videoFiles.length} arquivos de vídeo`);
        const season1Episodes = [];
        
        for (const videoFile of videoFiles) {
          const { isEpisode, episodeNumber } = isEpisodeFile(videoFile.name);
          
          if (isEpisode && episodeNumber > 0) {
            season1Episodes.push({
              episode: episodeNumber,
              path: videoFile.path,
              filename: videoFile.name
            });
          } else {
            // Se não conseguimos identificar o número do episódio, usar um contador
            season1Episodes.push({
              episode: season1Episodes.length + 1,
              path: videoFile.path,
              filename: videoFile.name
            });
          }
        }
        
        if (season1Episodes.length > 0) {
          seasons.push({
            season: 1,
            episodes: season1Episodes
          });
        }
      }
      
      if (seasons.length === 0) {
        throw new Error("Não foram encontrados episódios válidos no diretório");
      }
      
      // Buscar informações sobre a série usando a API
      const seriesInfo = await fetchSeriesInfoFromImdb(seriesTitle, apiKey);
      
      if (!seriesInfo) {
        // Se não conseguirmos informações da API, retornar apenas o que temos
        return {
          success: true,
          seriesInfo: {
            title: seriesTitle,
            path: directoryPath,
            seasons: seasons
          }
        };
      }
      
      // Retornar as informações completas
      return {
        success: true,
        seriesInfo: {
          title: seriesInfo.title,
          path: directoryPath,
          imdbId: seriesInfo.imdbId,
          year: seriesInfo.year,
          posterPath: seriesInfo.posterPath,
          backdropPath: seriesInfo.backdropPath,
          seasons: seasons
        }
      };
      
    } catch (error: any) {
      console.error("Erro ao identificar série:", error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Funções de banco de dados
  ipcMain.handle('db:initializeDatabase', async () => {
    try {
      return await db.initializeDatabase();
    } catch (err: any) {
      console.error('Erro ao inicializar banco de dados:', err);
      return { success: false, error: err.message || 'Erro desconhecido ao inicializar banco de dados' };
    }
  });

  ipcMain.handle('db:testConnection', async () => {
    try {
      return await db.testConnection();
    } catch (err: any) {
      console.error('Erro ao testar conexão com banco de dados:', err);
      return { success: false, error: err.message || 'Erro desconhecido ao testar conexão' };
    }
  });

  ipcMain.handle('db:getAllHDs', async () => {
    try {
      return await db.getAllHDs();
    } catch (err: any) {
      console.error('Erro ao obter HDs:', err);
      return { success: false, error: err.message || 'Erro ao obter HDs' };
    }
  });

  ipcMain.handle('db:saveHD', async (_, hd) => {
    try {
      return await db.saveHD(hd);
    } catch (err: any) {
      console.error('Erro ao salvar HD:', err);
      return { success: false, error: err.message || 'Erro ao salvar HD' };
    }
  });

  ipcMain.handle('db:deleteHD', async (_, id) => {
    try {
      return await db.deleteHD(id);
    } catch (err: any) {
      console.error('Erro ao excluir HD:', err);
      return { success: false, error: err.message || 'Erro ao excluir HD' };
    }
  });

  ipcMain.handle('db:updateHDConnection', async (_, id, connected) => {
    try {
      return await db.updateHDConnection(id, connected);
    } catch (err: any) {
      console.error('Erro ao atualizar conexão de HD:', err);
      return { success: false, error: err.message || 'Erro ao atualizar conexão de HD' };
    }
  });

  ipcMain.handle('db:getAllSeries', async () => {
    try {
      return await db.getAllSeries();
    } catch (err: any) {
      console.error('Erro ao obter séries:', err);
      return { success: false, error: err.message || 'Erro ao obter séries' };
    }
  });

  ipcMain.handle('db:saveSeries', async (_, series) => {
    try {
      return await db.saveSeries(series);
    } catch (err: any) {
      console.error('Erro ao salvar série:', err);
      return { success: false, error: err.message || 'Erro ao salvar série' };
    }
  });

  ipcMain.handle('db:deleteSeries', async (_, id) => {
    try {
      return await db.deleteSeries(id);
    } catch (err: any) {
      console.error('Erro ao excluir série:', err);
      return { success: false, error: err.message || 'Erro ao excluir série' };
    }
  });

  ipcMain.handle('db:updateSeriesVisibility', async (_, id, hidden) => {
    try {
      return await db.updateSeriesVisibility(id, hidden);
    } catch (err: any) {
      console.error('Erro ao atualizar visibilidade da série:', err);
      return { success: false, error: err.message || 'Erro ao atualizar visibilidade da série' };
    }
  });

  console.log("Handlers IPC configurados com sucesso")
} 
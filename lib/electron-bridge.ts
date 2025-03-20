/**
 * Bridge para API Electron - fornece implementações falsas seguras quando executado no navegador
 */

// Verificar se estamos executando no Electron
export const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
}

interface SeriesInfo {
  title: string;
  path: string;
  seasons: {
    season: number;
    episodes: {
      episode: number;
      path: string;
      filename: string;
    }[];
  }[];
  posterPath?: string;
  backdropPath?: string;
  year?: string;
  imdbId?: string;
}

// Função para simular a navegação de diretório no navegador
function simulateDirectoryExploration(path: string): FileItem[] {
  console.log(`[Browser Mode] Simulando exploração de diretório: ${path}`);

  // Simular atraso de rede
  return [
    { 
      name: 'Filmes', 
      path: `${path}/Filmes`, 
      isDirectory: true, 
      size: 0, 
      modified: new Date() 
    },
    { 
      name: 'Séries', 
      path: `${path}/Séries`, 
      isDirectory: true, 
      size: 0, 
      modified: new Date() 
    },
    { 
      name: 'Documentários', 
      path: `${path}/Documentários`, 
      isDirectory: true, 
      size: 0, 
      modified: new Date() 
    },
    { 
      name: 'filme1.mp4', 
      path: `${path}/filme1.mp4`, 
      isDirectory: false, 
      size: 1500000000, 
      modified: new Date() 
    },
    { 
      name: 'série.mkv', 
      path: `${path}/série.mkv`, 
      isDirectory: false, 
      size: 800000000, 
      modified: new Date() 
    }
  ];
}

// Função para simular a detecção de HDs no navegador
function simulateDriveDetection() {
  console.log(`[Browser Mode] Simulando detecção de HDs`);

  return [
    {
      letter: "C",
      label: "SSD Principal",
      path: "C:\\",
      size: 500000000000,
      type: "internal"
    },
    {
      letter: "D",
      label: "HD Filmes",
      path: "D:\\",
      size: 2000000000000,
      type: "internal"
    },
    {
      letter: "E",
      label: "HD Externo",
      path: "E:\\",
      size: 4000000000000,
      type: "external"
    }
  ];
}

// Função para simular o escaneamento de séries no navegador
function simulateSeriesScan(drivePath: string, apiKey: string): Promise<any> {
  console.log(`[Browser Mode] Simulando escaneamento de séries em: ${drivePath} com API key: ${apiKey.substring(0, 5)}...`);
  
  // Simular um atraso para parecer mais realista
  return new Promise((resolve) => {
    console.log("[Browser Mode] Iniciando simulação de escaneamento...");
    
    // Notificar início
    setTimeout(() => {
      console.log("[Browser Mode] Progresso: 25% - Analisando diretórios...");
    }, 500);
    
    setTimeout(() => {
      console.log("[Browser Mode] Progresso: 50% - Identificando séries...");
    }, 1000);
    
    setTimeout(() => {
      console.log("[Browser Mode] Progresso: 75% - Buscando metadados...");
    }, 1500);
    
    setTimeout(() => {
      // Séries fictícias para simulação
      console.log("[Browser Mode] Progresso: 100% - Escaneamento concluído!");
      
      // Extrair o diretório atual do caminho
      const dirName = drivePath.split(/[\/\\]/).pop() || "";
      
      // Se o caminho contém o nome de uma série conhecida, mostrar apenas essa série
      let seriesFound: SeriesInfo[] = [];
      
      // Verificar padrões específicos de nomes de séries
      if (drivePath.toLowerCase().includes("penguin") || dirName.toLowerCase().includes("penguin")) {
        console.log("Identificado: The Penguin");
        seriesFound.push({
          title: "The Penguin",
          path: drivePath,
          imdbId: "tt15323906",
          year: "2024",
          posterPath: "https://image.tmdb.org/t/p/w500/3ek1UtUyFDCTwVUWaKtUzAMJEus.jpg",
          backdropPath: "https://image.tmdb.org/t/p/original/fxBd0mlKa56vDEDr9zMfhQiJ9Vw.jpg",
          seasons: [
            {
              season: 1,
              episodes: [
                { episode: 1, path: `${drivePath}/Episódio 1.mp4`, filename: "Episódio 1.mp4" },
                { episode: 2, path: `${drivePath}/Episódio 2.mp4`, filename: "Episódio 2.mp4" },
                { episode: 3, path: `${drivePath}/Episódio 3.mp4`, filename: "Episódio 3.mp4" },
              ]
            }
          ]
        });
      } else if (drivePath.toLowerCase().includes("vinci") || dirName.toLowerCase().includes("vinci")) {
        seriesFound = [{
          title: "Da Vinci's Demons",
          path: drivePath,
          imdbId: "tt2094262",
          year: "2013-2015",
          posterPath: "https://image.tmdb.org/t/p/w500/ietgCh8XxWKrKa4gPVbKmNf3WKk.jpg",
          backdropPath: "https://image.tmdb.org/t/p/original/5Q6gjHVJiBNfVwmqrdHvYZSGdxx.jpg",
          seasons: [
            {
              season: 1,
              episodes: [
                { episode: 1, path: `${drivePath}/1 Temporada/S01E01.mp4`, filename: "S01E01.mp4" },
                { episode: 2, path: `${drivePath}/1 Temporada/S01E02.mp4`, filename: "S01E02.mp4" },
                { episode: 3, path: `${drivePath}/1 Temporada/S01E03.mp4`, filename: "S01E03.mp4" },
                { episode: 4, path: `${drivePath}/1 Temporada/S01E04.mp4`, filename: "S01E04.mp4" },
              ]
            },
            {
              season: 2,
              episodes: [
                { episode: 1, path: `${drivePath}/2 Temporada/S02E01.mp4`, filename: "S02E01.mp4" },
                { episode: 2, path: `${drivePath}/2 Temporada/S02E02.mp4`, filename: "S02E02.mp4" },
                { episode: 3, path: `${drivePath}/2 Temporada/S02E03.mp4`, filename: "S02E03.mp4" },
              ]
            },
            {
              season: 3,
              episodes: [
                { episode: 1, path: `${drivePath}/3 Temporada/S03E01.mp4`, filename: "S03E01.mp4" },
                { episode: 2, path: `${drivePath}/3 Temporada/S03E02.mp4`, filename: "S03E02.mp4" },
              ]
            }
          ]
        }];
      } else {
        // Para casos onde não identificamos especificamente a série, 
        // usamos o nome do diretório como nome da série
        console.log(`Série não identificada especificamente, usando nome da pasta: ${dirName}`);
        seriesFound.push({
          title: dirName.replace(/[._-]/g, ' ').trim(),
          path: drivePath,
          seasons: [
            {
              season: 1,
              episodes: [
                { episode: 1, path: `${drivePath}/Episódio 1.mp4`, filename: "Episódio 1.mp4" },
                { episode: 2, path: `${drivePath}/Episódio 2.mp4`, filename: "Episódio 2.mp4" },
                { episode: 3, path: `${drivePath}/Episódio 3.mp4`, filename: "Episódio 3.mp4" },
              ]
            }
          ]
        });
      }

      const result = {
        success: true,
        seriesFound,
        lastProgress: {
          message: `Escaneamento concluído. Encontradas ${seriesFound.length} séries.`,
          percentage: 100
        }
      };
      
      console.log("[Browser Mode] Retornando resultado:", result);
      resolve(result);
    }, 2000); // 2 segundos de atraso para simular processamento
  });
}

// Função para simular o download e salvamento de imagens no navegador
async function simulateDownloadImage(imageUrl: string, savePath: string, category: string): Promise<{ success: boolean; localPath: string; error?: string }> {
  console.log(`[Browser Mode] Simulando download de imagem: ${imageUrl}`);
  console.log(`[Browser Mode] Categoria: ${category}, Caminho destino: ${savePath}`);
  
  // No navegador, apenas simulamos o download e retornamos um caminho local fictício
  return new Promise((resolve) => {
    setTimeout(() => {
      // Extrair o nome do arquivo da URL
      const fileName = imageUrl.split('/').pop() || `image_${Date.now()}.jpg`;
      
      // Criar um caminho local fictício baseado na categoria (poster, backdrop, etc)
      const localFilePath = `/images/${category}/${fileName}`;
      
      console.log(`[Browser Mode] Imagem simulada salva em: ${localFilePath}`);
      
      // Em 90% dos casos, simular sucesso
      if (Math.random() > 0.1) {
        resolve({
          success: true,
          localPath: localFilePath
        });
      } else {
        // Em 10% dos casos, simular erro
        resolve({
          success: false,
          localPath: '',
          error: 'Erro ao baixar imagem (simulado)'
        });
      }
    }, 1000); // Simular um atraso de 1 segundo
  });
}

// Função para navegar para uma rota específica no Electron
function simulateNavigation(route: string): Promise<{ success: boolean, error?: string }> {
  console.log(`[Browser Mode] Simulando navegação para: ${route}`);
  
  // No navegador, nós simplesmente alteramos a localização da janela
  try {
    window.location.href = route;
    return Promise.resolve({ success: true });
  } catch (error) {
    console.error(`[Browser Mode] Erro ao navegar: ${error}`);
    return Promise.resolve({ success: false, error: String(error) });
  }
}

// API do Electron segura para navegadores
const browserSafeAPI = {
  // Explorar diretório
  exploreDirectory: async (path: string) => {
    return simulateDirectoryExploration(path);
  },

  // Selecionar diretório (mostrar mensagem)
  selectDirectory: async () => {
    console.log('[Browser Mode] Seleção de diretório não disponível no navegador');
    alert('A seleção de diretório só está disponível no aplicativo Electron.');
    return null;
  },

  // Detectar HDs
  detectDrives: async () => {
    return simulateDriveDetection();
  },

  // Abrir arquivo (mostrar mensagem)
  openFile: async (path: string) => {
    console.log(`[Browser Mode] Tentativa de abrir arquivo: ${path}`);
    alert(`A abertura de arquivos só está disponível no aplicativo Electron. Arquivo: ${path}`);
    return false;
  },

  // Verificar se caminho existe
  pathExists: async (path: string) => {
    console.log(`[Browser Mode] Verificando se o caminho existe: ${path}`);
    return true; // Sempre retornar true no navegador
  },

  // Escanear HD buscando séries
  scanDriveForSeries: async (drivePath: string, apiKey: string) => {
    console.log(`[Browser Mode] Chamada para scanDriveForSeries com caminho ${drivePath}`);
    return simulateSeriesScan(drivePath, apiKey);
  },
  
  // Baixar e salvar imagem localmente
  downloadImage: async (imageUrl: string, savePath: string, category: string) => {
    console.log(`[Browser Mode] Chamada para downloadImage com URL ${imageUrl}`);
    return simulateDownloadImage(imageUrl, savePath, category);
  },
  
  // Identificar série em um diretório
  identifySeriesFromDirectory: async (directoryPath: string, apiKey: string) => {
    console.log(`[Browser Mode] Chamada para identifySeriesFromDirectory com caminho ${directoryPath}`);
    // Extrair o nome da pasta
    const dirName = directoryPath.split(/[\/\\]/).pop() || "";
    const lowerDirName = dirName.toLowerCase();
    
    // Simular identificação de série pelo nome da pasta
    if (lowerDirName.includes("penguin")) {
      return {
        success: true,
        seriesInfo: {
          title: "The Penguin",
          path: directoryPath,
          imdbId: "tt15323906",
          year: "2024",
          posterPath: "https://image.tmdb.org/t/p/w500/3ek1UtUyFDCTwVUWaKtUzAMJEus.jpg",
          backdropPath: "https://image.tmdb.org/t/p/original/fxBd0mlKa56vDEDr9zMfhQiJ9Vw.jpg",
          seasons: [
            {
              season: 1,
              episodes: [
                { episode: 1, path: `${directoryPath}/Episódio 1.mp4`, filename: "Episódio 1.mp4" },
                { episode: 2, path: `${directoryPath}/Episódio 2.mp4`, filename: "Episódio 2.mp4" },
                { episode: 3, path: `${directoryPath}/Episódio 3.mp4`, filename: "Episódio 3.mp4" }
              ]
            }
          ]
        }
      };
    }
    
    // Caso contrário, usar o nome da pasta como nome da série
    return {
      success: true,
      seriesInfo: {
        title: dirName.replace(/[._-]/g, ' ').trim(),
        path: directoryPath,
        seasons: [
          {
            season: 1,
            episodes: [
              { episode: 1, path: `${directoryPath}/Episódio 1.mp4`, filename: "Episódio 1.mp4" },
              { episode: 2, path: `${directoryPath}/Episódio 2.mp4`, filename: "Episódio 2.mp4" },
              { episode: 3, path: `${directoryPath}/Episódio 3.mp4`, filename: "Episódio 3.mp4" }
            ]
          }
        ]
      }
    };
  },

  // API de navegação
  navigation: {
    navigate: (route: string) => simulateNavigation(route)
  }
};

// Debugging: verificar se as funções estão definidas
console.log('[Electron Bridge] Funções disponíveis em browserSafeAPI:', 
  Object.keys(browserSafeAPI).join(', '));

// Exportar a API apropriada
const finalAPI = isElectron ? (window as any).electronAPI : browserSafeAPI;

// Debugging: verificar as funções na API final
console.log('[Electron Bridge] Funções disponíveis na API final:', 
  Object.keys(finalAPI).join(', '));

// Verificar explicitamente a função scanDriveForSeries
console.log('[Electron Bridge] scanDriveForSeries está definida?', 
  typeof finalAPI.scanDriveForSeries === 'function' ? 'Sim' : 'Não');

export const electronAPI = finalAPI; 
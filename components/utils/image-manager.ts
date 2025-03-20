import { electronAPI } from "@/lib/electron-bridge";
import type { ImageDownloadResult } from "@/lib/types";

/**
 * Classe de utilitário para gerenciar imagens (download, armazenamento, etc)
 */
export class ImageManager {
  private static readonly IMAGES_BASE_PATH = "/images";
  private static readonly CATEGORIES = {
    POSTERS: "posters",
    BACKDROPS: "backdrops",
    SEASONS: "seasons",
    EPISODES: "episodes"
  };

  /**
   * Baixa uma imagem e armazena localmente
   * @param imageUrl URL da imagem a ser baixada
   * @param category Categoria da imagem (poster, backdrop, season, episode)
   * @param entityId ID da entidade (série, filme, etc) para nomear o arquivo
   * @returns Objeto com o resultado da operação
   */
  public static async downloadImage(
    imageUrl: string, 
    category: string, 
    entityId: string = "unknown"
  ): Promise<ImageDownloadResult> {
    if (!imageUrl) {
      return {
        success: false,
        localPath: "",
        error: "URL da imagem não fornecida"
      };
    }

    // Validar categoria
    if (!Object.values(this.CATEGORIES).includes(category)) {
      category = this.CATEGORIES.POSTERS; // Usar posters como padrão
    }

    try {
      // Extrair extensão do arquivo da URL (ou usar .jpg como padrão)
      const fileExtension = this.getFileExtensionFromUrl(imageUrl);
      const fileName = `${entityId}_${Date.now()}${fileExtension}`;
      const savePath = `public${this.IMAGES_BASE_PATH}/${category}/${fileName}`;
      const publicPath = `${this.IMAGES_BASE_PATH}/${category}/${fileName}`;

      console.log(`Salvando imagem em: ${savePath}`);
      
      // Chamar a API Electron para baixar a imagem
      const result = await electronAPI.downloadImage(imageUrl, savePath, category);
      
      // Ajustar o caminho retornado para ser relativo à pasta public para uso no front-end
      if (result.success) {
        result.localPath = publicPath;
      }
      
      return result;
    } catch (error) {
      console.error("Erro ao baixar imagem:", error);
      return {
        success: false,
        localPath: "",
        error: error instanceof Error ? error.message : "Erro desconhecido ao baixar imagem"
      };
    }
  }

  /**
   * Baixa uma imagem de poster e armazena localmente
   * @param posterUrl URL do poster
   * @param seriesId ID da série
   * @returns Caminho local do arquivo ou null em caso de erro
   */
  public static async downloadPoster(posterUrl: string, entityId: string): Promise<string | null> {
    const result = await this.downloadImage(posterUrl, this.CATEGORIES.POSTERS, entityId);
    return result.success ? result.localPath : null;
  }

  /**
   * Baixa uma imagem de fundo e armazena localmente
   * @param backdropUrl URL da imagem de fundo
   * @param entityId ID da entidade (série/filme)
   * @returns Caminho local do arquivo ou null em caso de erro
   */
  public static async downloadBackdrop(backdropUrl: string, entityId: string): Promise<string | null> {
    const result = await this.downloadImage(backdropUrl, this.CATEGORIES.BACKDROPS, entityId);
    return result.success ? result.localPath : null;
  }

  /**
   * Baixa uma imagem de temporada e armazena localmente
   * @param posterUrl URL do poster da temporada
   * @param seriesId ID da série
   * @param seasonNumber Número da temporada
   * @returns Caminho local do arquivo ou null em caso de erro
   */
  public static async downloadSeasonPoster(
    posterUrl: string, 
    seriesId: string, 
    seasonNumber: number
  ): Promise<string | null> {
    const entityId = `${seriesId}_season_${seasonNumber}`;
    const result = await this.downloadImage(posterUrl, this.CATEGORIES.SEASONS, entityId);
    return result.success ? result.localPath : null;
  }

  /**
   * Baixa uma imagem de episódio e armazena localmente
   * @param stillUrl URL da imagem do episódio
   * @param seriesId ID da série
   * @param seasonNumber Número da temporada
   * @param episodeNumber Número do episódio
   * @returns Caminho local do arquivo ou null em caso de erro
   */
  public static async downloadEpisodeStill(
    stillUrl: string, 
    seriesId: string, 
    seasonNumber: number, 
    episodeNumber: number
  ): Promise<string | null> {
    const entityId = `${seriesId}_s${seasonNumber}_e${episodeNumber}`;
    const result = await this.downloadImage(stillUrl, this.CATEGORIES.EPISODES, entityId);
    return result.success ? result.localPath : null;
  }

  /**
   * Extrai a extensão do arquivo da URL
   * @param url URL da imagem
   * @returns Extensão do arquivo com o ponto (ex: .jpg)
   */
  private static getFileExtensionFromUrl(url: string): string {
    // Remover parâmetros de query
    const cleanUrl = url.split('?')[0];
    
    // Extrair o nome do arquivo
    const fileName = cleanUrl.split('/').pop() || '';
    
    // Extrair a extensão
    const extension = fileName.includes('.') 
      ? fileName.substring(fileName.lastIndexOf('.')) 
      : '.jpg';
      
    return extension;
  }
} 
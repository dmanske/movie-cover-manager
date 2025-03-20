import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

// Usar better-sqlite3 para operações de banco de dados
let Database: any;
try {
  Database = require('better-sqlite3');
} catch (err) {
  console.error('Erro ao carregar better-sqlite3:', err);
}

const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class SQLiteDatabase {
  private db: any;
  private dbPath: string;
  private isInitialized: boolean = false;

  constructor() {
    // Definir caminho do banco de dados no diretório de dados do aplicativo
    this.dbPath = path.join(app.getPath('userData'), 'database.sqlite');
    console.log('Caminho do banco de dados:', this.dbPath);
  }

  /**
   * Inicializar o banco de dados
   */
  async initialize(): Promise<DatabaseResult> {
    try {
      if (!Database) {
        return { 
          success: false, 
          error: 'Módulo better-sqlite3 não disponível' 
        };
      }

      // Verificar se o diretório existe
      const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
        await mkdir(dbDir, { recursive: true });
      }

      // Criar ou abrir banco de dados
      this.db = new Database(this.dbPath, { verbose: console.log });

      // Criar tabelas necessárias
      this.createTables();

      this.isInitialized = true;
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao inicializar banco de dados:', err);
      return {
        success: false,
        error: err.message || 'Erro desconhecido ao inicializar banco de dados'
      };
    }
  }

  /**
   * Testar a conexão com o banco de dados
   */
  async testConnection(): Promise<DatabaseResult> {
    try {
      if (!Database) {
        return { 
          success: false, 
          error: 'Módulo better-sqlite3 não disponível' 
        };
      }

      // Verificar se o banco existe
      const dbExists = await exists(this.dbPath);
      if (!dbExists) {
        return { 
          success: false, 
          error: 'Banco de dados não encontrado. Execute a inicialização primeiro.' 
        };
      }

      // Tentar abrir e executar uma consulta simples
      if (!this.db) {
        this.db = new Database(this.dbPath);
      }

      const result = this.db.prepare('SELECT sqlite_version() as version').get();
      
      return { 
        success: true, 
        data: { version: result.version } 
      };
    } catch (err: any) {
      console.error('Erro ao testar conexão com banco de dados:', err);
      return {
        success: false,
        error: err.message || 'Erro desconhecido ao testar conexão'
      };
    }
  }

  /**
   * Criar as tabelas necessárias para o aplicativo
   */
  private createTables() {
    try {
  // Tabela de HDs
      this.db.prepare(`
    CREATE TABLE IF NOT EXISTS hds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      connected INTEGER DEFAULT 0,
          totalSpace REAL DEFAULT 0,
          freeSpace REAL DEFAULT 0,
          color TEXT,
          dateAdded TEXT,
          type TEXT,
      serialNumber TEXT,
      transferSpeed TEXT
    )
      `).run();
  
  // Tabela de Séries
      this.db.prepare(`
    CREATE TABLE IF NOT EXISTS series (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      hdId TEXT NOT NULL,
      hdPath TEXT,
      hidden INTEGER DEFAULT 0,
      imdbId TEXT,
          poster TEXT,
      posterUrl TEXT,
      posterLocal INTEGER DEFAULT 0,
      backdrop TEXT,
      backdropUrl TEXT,
      backdropLocal INTEGER DEFAULT 0,
      synopsis TEXT,
      year TEXT,
      creator TEXT,
          totalWatchTime INTEGER DEFAULT 0,
      watched INTEGER DEFAULT 0,
          genresJSON TEXT,
      FOREIGN KEY (hdId) REFERENCES hds(id)
    )
      `).run();
  
  // Tabela de Temporadas
      this.db.prepare(`
    CREATE TABLE IF NOT EXISTS seasons (
          id TEXT PRIMARY KEY,
      seriesId TEXT NOT NULL,
      number INTEGER NOT NULL,
          totalEpisodes INTEGER DEFAULT 0,
          availableEpisodes INTEGER DEFAULT 0,
      poster TEXT,
      posterUrl TEXT,
      FOREIGN KEY (seriesId) REFERENCES series(id)
    )
      `).run();
  
  // Tabela de Episódios
      this.db.prepare(`
    CREATE TABLE IF NOT EXISTS episodes (
          id TEXT PRIMARY KEY,
          seasonId TEXT NOT NULL,
      number INTEGER NOT NULL,
          title TEXT,
      titlePt TEXT,
          filename TEXT,
      path TEXT,
      duration INTEGER DEFAULT 0,
      watched INTEGER DEFAULT 0,
      synopsis TEXT,
          imdbRating REAL DEFAULT 0,
      releaseDate TEXT,
      stillImage TEXT,
      stillImageUrl TEXT,
          castJSON TEXT,
      FOREIGN KEY (seasonId) REFERENCES seasons(id)
    )
      `).run();

      console.log('Tabelas criadas com sucesso');
    } catch (err) {
      console.error('Erro ao criar tabelas:', err);
      throw err;
    }
  }

  /**
   * Verificar se o banco está inicializado
   */
  isConnected(): boolean {
    return this.isInitialized && !!this.db;
  }

  /**
   * Implementação da função de inicialização de banco de dados
   */
  async initializeDatabase(): Promise<DatabaseResult> {
    try {
      const result = await this.initialize();
      return result;
    } catch (err: any) {
      console.error('Erro ao inicializar banco de dados:', err);
      return {
        success: false,
        error: err.message || 'Erro desconhecido ao inicializar banco de dados'
      };
    }
  }

  /**
   * Obter todos os HDs do banco
   */
  async getAllHDs(): Promise<DatabaseResult> {
    try {
      if (!this.isConnected()) {
        return { success: false, error: 'Banco de dados não inicializado' };
      }

      const hds = this.db.prepare('SELECT * FROM hds').all();
      return { success: true, data: hds };
    } catch (err: any) {
      console.error('Erro ao obter HDs:', err);
      return {
        success: false,
        error: err.message || 'Erro ao obter HDs'
      };
    }
  }

  /**
   * Obter todas as séries do banco
   */
  async getAllSeries(): Promise<DatabaseResult> {
    try {
      if (!this.isConnected()) {
        return { success: false, error: 'Banco de dados não inicializado' };
      }

      // Implementação básica para obter apenas os dados das séries
      // Em uma implementação completa, você deverá buscar também temporadas e episódios
      const series = this.db.prepare('SELECT * FROM series').all();
      
      // Formatar para o formato esperado pelo app
      const formattedSeries = await Promise.all(series.map(async (s: any) => {
        // Converter JSON de gêneros
        let genres = [];
        try {
          if (s.genresJSON) {
            genres = JSON.parse(s.genresJSON);
          }
        } catch (e) {
          console.error('Erro ao parsear gêneros:', e);
        }
        
        // Obter temporadas desta série
        const seasons = await this.getSeriesSeasons(s.id);
        
    return {
          ...s,
          hidden: !!s.hidden, // Converter para boolean
          watched: !!s.watched, // Converter para boolean
          posterLocal: !!s.posterLocal, // Converter para boolean
          backdropLocal: !!s.backdropLocal, // Converter para boolean
      genres,
          seasons: seasons.success ? seasons.data : []
        };
      }));

      return { success: true, data: formattedSeries };
    } catch (err: any) {
      console.error('Erro ao obter séries:', err);
      return {
        success: false,
        error: err.message || 'Erro ao obter séries'
      };
    }
  }

  /**
   * Obter temporadas de uma série específica
   */
  private async getSeriesSeasons(seriesId: string): Promise<DatabaseResult> {
    try {
      const seasons = this.db.prepare('SELECT * FROM seasons WHERE seriesId = ? ORDER BY number').all(seriesId);
      
      // Para cada temporada, buscar seus episódios
      const seasonsWithEpisodes = await Promise.all(seasons.map(async (season: any) => {
        const episodes = await this.getSeasonEpisodes(season.id);
        return {
          ...season,
          episodes: episodes.success ? episodes.data : []
        };
      }));
      
      return { success: true, data: seasonsWithEpisodes };
    } catch (err: any) {
      console.error('Erro ao obter temporadas:', err);
  return {
        success: false, 
        error: err.message || 'Erro ao obter temporadas'
      };
    }
  }

  /**
   * Obter episódios de uma temporada
   */
  private async getSeasonEpisodes(seasonId: string): Promise<DatabaseResult> {
    try {
      const episodes = this.db.prepare('SELECT * FROM episodes WHERE seasonId = ? ORDER BY number').all(seasonId);
      
      // Formatar dados dos episódios
      const formattedEpisodes = episodes.map((ep: any) => {
        // Converter JSON do elenco se existir
        let cast = [];
        try {
          if (ep.castJSON) {
            cast = JSON.parse(ep.castJSON);
          }
        } catch (e) {
          console.error('Erro ao parsear elenco:', e);
        }
    
    return {
          ...ep,
          watched: !!ep.watched, // Converter para boolean
          cast
    };
  });
      
      return { success: true, data: formattedEpisodes };
    } catch (err: any) {
      console.error('Erro ao obter episódios:', err);
      return {
        success: false,
        error: err.message || 'Erro ao obter episódios'
      };
    }
  }

  /**
   * Salvar informações de HD
   */
  async saveHD(hd: any): Promise<DatabaseResult> {
    try {
      if (!this.isConnected()) {
        return { success: false, error: 'Banco de dados não inicializado' };
      }

      // Garantir que temos um ID
      const hdToSave = { ...hd };
      if (!hdToSave.id) {
        hdToSave.id = uuidv4();
      }

      // Verificar se já existe
      const existing = this.db.prepare('SELECT id FROM hds WHERE id = ?').get(hdToSave.id);
      
      if (existing) {
        // Atualizar
        this.db.prepare(`
          UPDATE hds SET 
            name = ?, path = ?, connected = ?, totalSpace = ?, freeSpace = ?,
            color = ?, dateAdded = ?, type = ?, serialNumber = ?, transferSpeed = ?
          WHERE id = ?
        `).run(
          hdToSave.name, 
          hdToSave.path, 
          hdToSave.connected ? 1 : 0, 
          hdToSave.totalSpace || 0, 
          hdToSave.freeSpace || 0,
          hdToSave.color || '', 
          hdToSave.dateAdded || new Date().toISOString(), 
          hdToSave.type || 'unknown',
          hdToSave.serialNumber || '',
          hdToSave.transferSpeed || '',
          hdToSave.id
        );
      } else {
        // Inserir novo
        this.db.prepare(`
          INSERT INTO hds (
            id, name, path, connected, totalSpace, freeSpace,
            color, dateAdded, type, serialNumber, transferSpeed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          hdToSave.id,
          hdToSave.name, 
          hdToSave.path, 
          hdToSave.connected ? 1 : 0, 
          hdToSave.totalSpace || 0, 
          hdToSave.freeSpace || 0,
          hdToSave.color || '', 
          hdToSave.dateAdded || new Date().toISOString(), 
          hdToSave.type || 'unknown',
          hdToSave.serialNumber || '',
          hdToSave.transferSpeed || ''
        );
      }

      return { success: true, data: hdToSave };
    } catch (err: any) {
      console.error('Erro ao salvar HD:', err);
      return {
        success: false,
        error: err.message || 'Erro ao salvar HD'
      };
    }
  }

  /**
   * Atualizar estado de conexão de um HD
   */
  async updateHDConnection(id: string, connected: boolean): Promise<DatabaseResult> {
    try {
      if (!this.isConnected()) {
        return { success: false, error: 'Banco de dados não inicializado' };
      }

      this.db.prepare('UPDATE hds SET connected = ? WHERE id = ?').run(connected ? 1 : 0, id);

      return { success: true };
    } catch (err: any) {
      console.error('Erro ao atualizar conexão de HD:', err);
      return {
        success: false,
        error: err.message || 'Erro ao atualizar conexão de HD'
      };
    }
  }

  /**
   * Excluir um HD
   */
  async deleteHD(id: string): Promise<DatabaseResult> {
    try {
      if (!this.isConnected()) {
        return { success: false, error: 'Banco de dados não inicializado' };
      }

      this.db.prepare('DELETE FROM hds WHERE id = ?').run(id);

      return { success: true };
    } catch (err: any) {
      console.error('Erro ao excluir HD:', err);
      return {
        success: false,
        error: err.message || 'Erro ao excluir HD'
      };
    }
  }

  /**
   * Salvar informações de uma série
   * Simplificado - uma implementação completa salvaria também temporadas e episódios
   */
  async saveSeries(series: any): Promise<DatabaseResult> {
    try {
      if (!this.isConnected()) {
        return { success: false, error: 'Banco de dados não inicializado' };
      }

      // Garantir que temos um ID
      const seriesToSave = { ...series };
      if (!seriesToSave.id) {
        seriesToSave.id = uuidv4();
      }

      // Serializar gêneros
      const genresJSON = seriesToSave.genres ? JSON.stringify(seriesToSave.genres) : null;

      // Verificar se já existe
      const existing = this.db.prepare('SELECT id FROM series WHERE id = ?').get(seriesToSave.id);
      
      if (existing) {
        // Atualizar
        this.db.prepare(`
          UPDATE series SET 
            title = ?, hdId = ?, hdPath = ?, hidden = ?, imdbId = ?,
            poster = ?, posterUrl = ?, posterLocal = ?, backdrop = ?,
            backdropUrl = ?, backdropLocal = ?, synopsis = ?, year = ?,
            creator = ?, totalWatchTime = ?, watched = ?, genresJSON = ?
          WHERE id = ?
        `).run(
          seriesToSave.title, 
          seriesToSave.hdId, 
          seriesToSave.hdPath || '', 
          seriesToSave.hidden ? 1 : 0, 
          seriesToSave.imdbId || '',
          seriesToSave.poster || '', 
          seriesToSave.posterUrl || '', 
          seriesToSave.posterLocal ? 1 : 0,
          seriesToSave.backdrop || '', 
          seriesToSave.backdropUrl || '', 
          seriesToSave.backdropLocal ? 1 : 0,
          seriesToSave.synopsis || '',
          seriesToSave.year || '',
          seriesToSave.creator || '',
          seriesToSave.totalWatchTime || 0,
          seriesToSave.watched ? 1 : 0,
          genresJSON,
          seriesToSave.id
        );
      } else {
        // Inserir novo
        this.db.prepare(`
          INSERT INTO series (
            id, title, hdId, hdPath, hidden, imdbId,
            poster, posterUrl, posterLocal, backdrop,
            backdropUrl, backdropLocal, synopsis, year,
            creator, totalWatchTime, watched, genresJSON
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          seriesToSave.id,
          seriesToSave.title, 
          seriesToSave.hdId, 
          seriesToSave.hdPath || '', 
          seriesToSave.hidden ? 1 : 0, 
          seriesToSave.imdbId || '',
          seriesToSave.poster || '', 
          seriesToSave.posterUrl || '', 
          seriesToSave.posterLocal ? 1 : 0,
          seriesToSave.backdrop || '', 
          seriesToSave.backdropUrl || '', 
          seriesToSave.backdropLocal ? 1 : 0,
          seriesToSave.synopsis || '',
          seriesToSave.year || '',
          seriesToSave.creator || '',
          seriesToSave.totalWatchTime || 0,
          seriesToSave.watched ? 1 : 0,
          genresJSON
        );
      }

      // Para uma implementação completa, você precisaria salvar também
      // temporadas e episódios de forma recursiva
      if (seriesToSave.seasons && seriesToSave.seasons.length > 0) {
        await this.saveSeriesSeasons(seriesToSave.id, seriesToSave.seasons);
      }

      return { success: true, data: seriesToSave };
    } catch (err: any) {
      console.error('Erro ao salvar série:', err);
    return {
        success: false,
        error: err.message || 'Erro ao salvar série'
      };
    }
  }

  /**
   * Salvar temporadas de uma série
   */
  private async saveSeriesSeasons(seriesId: string, seasons: any[]): Promise<DatabaseResult> {
    try {
      for (const season of seasons) {
        // Garantir que temos um ID
        const seasonToSave = { ...season };
        if (!seasonToSave.id) {
          seasonToSave.id = uuidv4();
        }
        
        // Verificar se já existe
        const existing = this.db.prepare('SELECT id FROM seasons WHERE id = ?').get(seasonToSave.id);
        
        if (existing) {
          // Atualizar
          this.db.prepare(`
    UPDATE seasons SET
              seriesId = ?, number = ?, totalEpisodes = ?, availableEpisodes = ?,
              poster = ?, posterUrl = ?
    WHERE id = ?
          `).run(
            seriesId,
            seasonToSave.number, 
            seasonToSave.totalEpisodes || 0, 
            seasonToSave.availableEpisodes || 0, 
            seasonToSave.poster || '',
            seasonToSave.posterUrl || '',
            seasonToSave.id
          );
      } else {
          // Inserir novo
          this.db.prepare(`
            INSERT INTO seasons (
              id, seriesId, number, totalEpisodes, availableEpisodes,
              poster, posterUrl
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            seasonToSave.id,
            seriesId,
            seasonToSave.number, 
            seasonToSave.totalEpisodes || 0, 
            seasonToSave.availableEpisodes || 0, 
            seasonToSave.poster || '',
            seasonToSave.posterUrl || ''
          );
        }
        
        // Salvar episódios desta temporada
        if (seasonToSave.episodes && seasonToSave.episodes.length > 0) {
          await this.saveSeasonEpisodes(seasonToSave.id, seasonToSave.episodes);
        }
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao salvar temporadas:', err);
    return {
        success: false,
        error: err.message || 'Erro ao salvar temporadas'
      };
    }
  }

  /**
   * Salvar episódios de uma temporada
   */
  private async saveSeasonEpisodes(seasonId: string, episodes: any[]): Promise<DatabaseResult> {
    try {
      for (const episode of episodes) {
        // Garantir que temos um ID
        const episodeToSave = { ...episode };
        if (!episodeToSave.id) {
          episodeToSave.id = uuidv4();
        }
        
        // Serializar elenco
        const castJSON = episodeToSave.cast ? JSON.stringify(episodeToSave.cast) : null;
        
        // Verificar se já existe
        const existing = this.db.prepare('SELECT id FROM episodes WHERE id = ?').get(episodeToSave.id);
        
        if (existing) {
          // Atualizar
          this.db.prepare(`
    UPDATE episodes SET
              seasonId = ?, number = ?, title = ?, titlePt = ?,
              filename = ?, path = ?, duration = ?, watched = ?,
              synopsis = ?, imdbRating = ?, releaseDate = ?,
              stillImage = ?, stillImageUrl = ?, castJSON = ?
            WHERE id = ?
          `).run(
    seasonId,
            episodeToSave.number, 
            episodeToSave.title || '', 
            episodeToSave.titlePt || '', 
            episodeToSave.filename || '',
            episodeToSave.path || '',
            episodeToSave.duration || 0,
            episodeToSave.watched ? 1 : 0,
            episodeToSave.synopsis || '',
            episodeToSave.imdbRating || 0,
            episodeToSave.releaseDate || '',
            episodeToSave.stillImage || '',
            episodeToSave.stillImageUrl || '',
            castJSON,
            episodeToSave.id
          );
        } else {
          // Inserir novo
          this.db.prepare(`
            INSERT INTO episodes (
              id, seasonId, number, title, titlePt,
              filename, path, duration, watched,
              synopsis, imdbRating, releaseDate,
              stillImage, stillImageUrl, castJSON
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            episodeToSave.id,
            seasonId,
            episodeToSave.number, 
            episodeToSave.title || '', 
            episodeToSave.titlePt || '', 
            episodeToSave.filename || '',
            episodeToSave.path || '',
            episodeToSave.duration || 0,
            episodeToSave.watched ? 1 : 0,
            episodeToSave.synopsis || '',
            episodeToSave.imdbRating || 0,
            episodeToSave.releaseDate || '',
            episodeToSave.stillImage || '',
            episodeToSave.stillImageUrl || '',
            castJSON
          );
        }
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao salvar episódios:', err);
      return {
        success: false,
        error: err.message || 'Erro ao salvar episódios'
      };
    }
  }

  /**
   * Atualizar visibilidade de uma série
   */
  async updateSeriesVisibility(id: string, hidden: boolean): Promise<DatabaseResult> {
    try {
      if (!this.isConnected()) {
        return { success: false, error: 'Banco de dados não inicializado' };
      }

      this.db.prepare('UPDATE series SET hidden = ? WHERE id = ?').run(hidden ? 1 : 0, id);

      return { success: true };
    } catch (err: any) {
      console.error('Erro ao atualizar visibilidade da série:', err);
      return {
        success: false,
        error: err.message || 'Erro ao atualizar visibilidade da série'
      };
    }
  }

  /**
   * Excluir uma série
   */
  async deleteSeries(id: string): Promise<DatabaseResult> {
    try {
      if (!this.isConnected()) {
        return { success: false, error: 'Banco de dados não inicializado' };
      }

      // Excluir episódios primeiro
      this.db.prepare(`
        DELETE FROM episodes 
        WHERE seasonId IN (SELECT id FROM seasons WHERE seriesId = ?)
      `).run(id);

      // Excluir temporadas
      this.db.prepare('DELETE FROM seasons WHERE seriesId = ?').run(id);

      // Excluir série
      this.db.prepare('DELETE FROM series WHERE id = ?').run(id);

      return { success: true };
    } catch (err: any) {
      console.error('Erro ao excluir série:', err);
      return {
        success: false,
        error: err.message || 'Erro ao excluir série'
      };
    }
  }

  /**
   * Fechar a conexão com o banco de dados
   */
  close() {
    try {
      if (this.db) {
        this.db.close();
        this.isInitialized = false;
      }
    } catch (err) {
      console.error('Erro ao fechar banco de dados:', err);
    }
  }
}

// Criar e exportar uma instância do banco de dados
const db = new SQLiteDatabase();

export type { DatabaseResult };
export { db }; 
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  exploreDirectory: (directoryPath: string) => Promise<FileSystemItem[]>;
  selectDirectory: () => Promise<string | null>;
  scanDriveForSeries: (drivePath: string, apiKey: string, forceRefresh?: boolean) => Promise<any>;
  identifySeriesFromDirectory: (directoryPath: string, apiKey: string) => Promise<any>;
  downloadImage: (imageUrl: string, savePath: string, category: string) => Promise<ImageDownloadResult>;
  
  db: {
    // Séries
    getAllSeries: () => Promise<{ success: boolean; data: Series[]; error?: string }>;
    getSeriesById: (id: string) => Promise<{ success: boolean; data: Series | null; error?: string }>;
    saveSeries: (series: Series) => Promise<{ success: boolean; error?: string }>;
    deleteSeries: (id: string) => Promise<{ success: boolean; error?: string }>;
    updateSeriesVisibility: (id: string, hidden: boolean) => Promise<{ success: boolean; error?: string }>;
    
    // HDs
    getAllHDs: () => Promise<{ success: boolean; data: HD[]; error?: string }>;
    saveHD: (hd: HD) => Promise<{ success: boolean; error?: string }>;
    deleteHD: (id: string) => Promise<{ success: boolean; error?: string }>;
    updateHDConnection: (id: string, connected: boolean) => Promise<{ success: boolean; error?: string }>;
    
    // Migração
    migrateFromLocalStorage: (data: any) => Promise<{ success: boolean; message: string }>;
  }
}

interface FileSystemItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
}

interface ImageDownloadResult {
  success: boolean;
  localPath: string;
  error?: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}


import { contextBridge, ipcRenderer } from "electron"

// Expor API segura
contextBridge.exposeInMainWorld("electronAPI", {
  // Manipulação de diretórios e arquivos
  exploreDirectory: (path: string) => ipcRenderer.invoke("explore-directory", path),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  detectDrives: () => ipcRenderer.invoke("detect-drives"),
  openFile: (path: string) => ipcRenderer.invoke("open-file", path),
  pathExists: (path: string) => ipcRenderer.invoke("path-exists", path),
  
  // Escaneamento de séries
  scanDriveForSeries: (drivePath: string, apiKey: string, forceRefresh = false) => 
    ipcRenderer.invoke("scan-drive-for-series", drivePath, apiKey, forceRefresh),
  
  identifySeriesFromDirectory: (directoryPath: string, apiKey: string) => 
    ipcRenderer.invoke("identify-series-from-directory", directoryPath, apiKey),
  
  // Manipulação de imagens
  downloadImage: (url: string, savePath: string, category: string) => 
    ipcRenderer.invoke("download-image", url, savePath, category),
  
  // Funções de banco de dados
  db: {
    testConnection: () => ipcRenderer.invoke('db:testConnection'),
    initializeDatabase: () => ipcRenderer.invoke('db:initializeDatabase'),
    getAllHDs: () => ipcRenderer.invoke('db:getAllHDs'),
    saveHD: (hd: any) => ipcRenderer.invoke('db:saveHD', hd),
    deleteHD: (id: string) => ipcRenderer.invoke('db:deleteHD', id),
    updateHDConnection: (id: string, connected: boolean) => 
      ipcRenderer.invoke('db:updateHDConnection', id, connected),
    getAllSeries: () => ipcRenderer.invoke('db:getAllSeries'),
    saveSeries: (series: any) => ipcRenderer.invoke('db:saveSeries', series),
    deleteSeries: (id: string) => ipcRenderer.invoke('db:deleteSeries', id),
    updateSeriesVisibility: (id: string, hidden: boolean) => 
      ipcRenderer.invoke('db:updateSeriesVisibility', id, hidden)
  }
}) 
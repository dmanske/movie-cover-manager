const { contextBridge, ipcRenderer } = require("electron")

// Expor funcionalidades do Electron para o aplicativo web
contextBridge.exposeInMainWorld("electronAPI", {
  // Versão do aplicativo
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  
  // Operações de sistema de arquivos
  exploreDirectory: (directoryPath) => ipcRenderer.invoke("explore-directory", directoryPath),
  
  // Selecionar diretório
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  
  // Escanear HD para séries
  scanDriveForSeries: (drivePath, apiKey, forceRefresh) => ipcRenderer.invoke("scan-drive-for-series", drivePath, apiKey, forceRefresh),
  
  // Identificar série em um diretório
  identifySeriesFromDirectory: (directoryPath, apiKey) => ipcRenderer.invoke("identify-series-from-directory", directoryPath, apiKey),
  
  // Baixar imagem
  downloadImage: (imageUrl, savePath, category) => ipcRenderer.invoke("download-image", imageUrl, savePath, category),
  
  // Métodos do banco de dados
  db: {
    // Séries
    getAllSeries: () => ipcRenderer.invoke("db-get-all-series"),
    getSeriesById: (id) => ipcRenderer.invoke("db-get-series-by-id", id),
    saveSeries: (series) => ipcRenderer.invoke("db-save-series", series),
    deleteSeries: (id) => ipcRenderer.invoke("db-delete-series", id),
    updateSeriesVisibility: (id, hidden) => ipcRenderer.invoke("db-update-series-visibility", id, hidden),
    
    // HDs
    getAllHDs: () => ipcRenderer.invoke("db-get-all-hds"),
    saveHD: (hd) => ipcRenderer.invoke("db-save-hd", hd),
    deleteHD: (id) => ipcRenderer.invoke("db-delete-hd", id),
    updateHDConnection: (id, connected) => ipcRenderer.invoke("db-update-hd-connection", id, connected),
    
    // Migração
    migrateFromLocalStorage: (data) => ipcRenderer.invoke("db-migrate-from-localstorage", data)
  }
}) 
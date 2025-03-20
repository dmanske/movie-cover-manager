const { contextBridge, ipcRenderer } = require("electron")

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Funções para gerenciamento de HDs
  getDrives: () => ipcRenderer.invoke("get-drives"),

  // Funções para exploração de arquivos
  exploreDirectory: (dirPath) => ipcRenderer.invoke("explore-directory", dirPath),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),

  // Funções para mídia
  playMedia: (filePath) => ipcRenderer.invoke("play-media", filePath),
  scanMedia: (dirPath) => ipcRenderer.invoke("scan-media", dirPath),

  // Funções para notificações do sistema
  showNotification: (title, body) => {
    new Notification(title, { body })
  },
})


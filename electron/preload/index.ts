import { contextBridge, ipcRenderer } from "electron"
import * as fs from 'fs';
import * as path from 'path';
import * as diskusage from 'diskusage';

// Expor APIs protegidas para o renderer através do objeto contextBridge
contextBridge.exposeInMainWorld("electronAPI", {
  // API para explorar diretório
  exploreDirectory: (path: string) => ipcRenderer.invoke("explore-directory", path),
  
  // API para selecionar diretório usando o diálogo nativo
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  
  // API para detectar HDs conectados
  detectDrives: () => ipcRenderer.invoke("detect-drives"),
  
  // API para abrir um arquivo com o aplicativo padrão
  openFile: (path: string) => ipcRenderer.invoke("open-file", path),
  
  // API para verificar se um caminho existe
  pathExists: (path: string) => ipcRenderer.invoke("path-exists", path),

  // API para escanear um HD buscando séries
  scanDriveForSeries: (drivePath: string, apiKey: string) => 
    ipcRenderer.invoke("scan-drive-for-series", drivePath, apiKey),

  // API de navegação
  navigation: {
    navigate: (route: string) => ipcRenderer.invoke('navigate', route)
  }
})

// Verificação se o preload foi carregado corretamente
console.log("Preload do Electron carregado com sucesso!") 
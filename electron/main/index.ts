import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from "node:path"
import { setupIpcHandlers } from "./ipc-handlers"
import db from './database'
import { setupNavigationHandlers } from './navigation-handler'

// Desabilitar alertas de segurança no desenvolvimento
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true"

function createWindow(): void {
  // Criar a janela do browser
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true
    }
  })

  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  // HMR para desenvolvimento 
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // Carrega o arquivo index.html para produção
    mainWindow.loadFile(join(__dirname, "../../dist/index.html"))
  }

  // Configurar manipulador de navegação
  setupNavigationHandlers(mainWindow)
}

// Este método será chamado quando Electron terminar sua inicialização
// e estiver pronto para criar janelas do navegador.
app.whenReady().then(() => {
  // Configurar handlers IPC
  setupIpcHandlers()

  // Inicializar banco de dados
  if (!db.initDatabase()) {
    console.error("Falha ao inicializar o banco de dados. A aplicação pode não funcionar corretamente.");
  }

  // Criar a janela principal
  createWindow()

  app.on("activate", () => {
    // No macOS, é comum recriar uma janela quando
    // o ícone do dock é clicado e não há outras janelas abertas
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Encerrar quando todas as janelas estiverem fechadas, exceto no macOS.
// No macOS, é comum que as aplicações permaneçam ativas até que o usuário
// as encerre explicitamente com Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// Fechar o banco de dados quando o aplicativo for encerrado
app.on('quit', () => {
  db.closeDatabase();
}); 
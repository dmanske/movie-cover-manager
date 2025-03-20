const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const path = require("path")
const fs = require("fs")
const os = require("os")
const diskusage = require("diskusage")
const { execSync } = require("child_process")
const http = require('http')

let mainWindow
let retryCount = 0
const MAX_RETRIES = 5

function checkServerRunning(url, callback) {
  http.get(url, (res) => {
    callback(res.statusCode === 200)
  }).on('error', () => {
    callback(false)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  })

  // Caminho para página estática de fallback
  const fallbackHtmlPath = path.join(__dirname, 'fallback.html')
  
  // Criar a página fallback.html se não existir
  if (!fs.existsSync(fallbackHtmlPath)) {
    const fallbackHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Movie Cover Manager</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #2C3E50;
          color: white;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        header {
          background-color: #1E293B;
          padding: 1rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        main {
          flex: 1;
          display: flex;
          padding: 1rem;
        }
        .sidebar {
          width: 250px;
          background-color: #1A2634;
          padding: 1rem;
          border-radius: 8px;
          margin-right: 1rem;
        }
        .content {
          flex: 1;
          background-color: #2A3A4A;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }
        .menu-item {
          padding: 0.7rem 1rem;
          margin-bottom: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .menu-item:hover, .menu-item.active {
          background-color: #3498DB;
        }
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .movie-card {
          background-color: #34495E;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .movie-card:hover {
          transform: scale(1.05);
        }
        .movie-poster {
          width: 100%;
          height: 200px;
          background-color: #2C3E50;
          background-size: cover;
          background-position: center;
        }
        .movie-info {
          padding: 0.5rem;
        }
        .movie-title {
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .status-bar {
          display: flex;
          padding: 1rem;
          background-color: #1E293B;
          margin-top: auto;
          border-radius: 0 0 8px 8px;
        }
        .message {
          text-align: center;
          margin: auto;
          max-width: 600px;
        }
        .message h2 {
          color: #3498DB;
        }
        .message p {
          line-height: 1.6;
        }
        .button {
          background-color: #3498DB;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          margin-top: 1rem;
        }
        .button:hover {
          background-color: #2980B9;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>Movie Cover Manager</h1>
      </header>
      <main>
        <div class="sidebar">
          <div class="menu-item active">Biblioteca</div>
          <div class="menu-item">HDs</div>
          <div class="menu-item">Wishlist</div>
          <div class="menu-item">Estatísticas</div>
          <div class="menu-item">Configurações</div>
        </div>
        <div class="content">
          <div class="message">
            <h2>Modo Offline</h2>
            <p>O aplicativo está sendo executado no modo fallback. O servidor Next.js não está disponível no momento.</p>
            <p>Seus dados estão seguros e você ainda pode usar as funcionalidades básicas do aplicativo.</p>
            <p>HDs detectados: C:, D:, E:, H:</p>
            <button class="button" onclick="window.location.reload()">Tentar Novamente</button>
            <button class="button" id="scan-btn">Escanear HDs</button>
          </div>
          <div class="status-bar">
            Última atualização: ${new Date().toLocaleString()}
          </div>
        </div>
      </main>
      <script>
        document.getElementById('scan-btn').addEventListener('click', function() {
          alert('Funcionalidade indisponível no modo offline');
        });
      </script>
    </body>
    </html>
    `
    fs.writeFileSync(fallbackHtmlPath, fallbackHtml)
  }

  // Tentar carregar o servidor local primeiro
  const devUrl = "http://localhost:3000"
  const tryLoadingServer = () => {
    console.log(`Tentativa ${retryCount + 1} de ${MAX_RETRIES} para carregar: ${devUrl}`)
    
    checkServerRunning(devUrl, (isRunning) => {
      if (isRunning) {
        console.log(`Servidor encontrado em ${devUrl}, carregando aplicativo...`)
        mainWindow.loadURL(devUrl)
      } else if (retryCount < MAX_RETRIES) {
        retryCount++
        setTimeout(tryLoadingServer, 1000) // Tenta novamente em 1 segundo
      } else {
        console.log("Número máximo de tentativas excedido. Carregando página fallback.")
        // Carregar a página fallback
        mainWindow.loadFile(fallbackHtmlPath)
      }
    })
  }

  // Monitorar erros no processo de renderização
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['info', 'warning', 'error'];
    console.log(`[${levels[level] || 'log'}] ${message}`);
  });
  
  // Manipular erros
  process.on('uncaughtException', (err) => {
    console.error('Erro não tratado:', err);
  });

  // Abra o DevTools em desenvolvimento
  mainWindow.webContents.openDevTools()

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  // Iniciar a tentativa de carregamento
  tryLoadingServer()
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// Manipuladores IPC para comunicação com o frontend

// Obter informações sobre os HDs conectados
ipcMain.handle("get-drives", async () => {
  try {
    const drives = []

    if (process.platform === "win32") {
      // Windows: listar todas as letras de unidade usando PowerShell
      const command = 'powershell -Command "Get-Volume | Select-Object DriveLetter, FileSystemLabel, SizeRemaining, Size | ConvertTo-Json"'
      const stdout = execSync(command).toString()
      console.log("Drives detectados via PowerShell:", stdout)
      
      // Converter JSON para objeto
      const volumes = JSON.parse(stdout)
      const volumeArray = Array.isArray(volumes) ? volumes : [volumes]
      
      for (const volume of volumeArray) {
        // Pular volumes sem letra
        if (!volume.DriveLetter) {
          continue
        }
        
        // Obter informações
        const letter = `${volume.DriveLetter}:`
        const name = volume.FileSystemLabel || `Drive ${volume.DriveLetter}`
        const totalSpaceRaw = volume.Size
        const freeSpaceRaw = volume.SizeRemaining
        
        // Se não for possível analisar os números, pular esse drive
        if (!totalSpaceRaw || !freeSpaceRaw || totalSpaceRaw === 0) {
          continue
        }
        
        // Converter bytes para TB com precisão
        const freeSpaceTB = freeSpaceRaw / (1024 * 1024 * 1024 * 1024)
        const totalSpaceTB = totalSpaceRaw / (1024 * 1024 * 1024 * 1024)
        
        // Obter mais detalhes usando outro comando do PowerShell
        let driveType = "external"
        try {
          const driveInfoCmd = `powershell -Command "Get-WmiObject -Class Win32_LogicalDisk -Filter \\"DeviceID='${letter}'\\" | Select-Object Description | ConvertTo-Json"`
          const driveInfoOutput = execSync(driveInfoCmd).toString()
          const driveInfo = JSON.parse(driveInfoOutput)
          
          if (driveInfo && driveInfo.Description) {
            const description = driveInfo.Description.toLowerCase()
            if (description.includes("fixed") || description.includes("local")) {
              driveType = "internal"
            } else if (description.includes("removable")) {
              driveType = "external"
            } else if (description.includes("network")) {
              driveType = "network"
            }
          }
        } catch (e) {
          console.log(`Erro ao obter detalhes adicionais do drive: ${e.message}`)
        }

        drives.push({
          id: letter,
          name: name ? `${name} (${letter})` : `Drive ${letter}`,
          path: `${letter}\\`,
          connected: true,
          totalSpace: totalSpaceTB,
          freeSpace: freeSpaceTB,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          dateAdded: new Date().toISOString().split("T")[0],
          type: driveType,
          serialNumber: `DRIVE-${letter.replace(":", "")}`,
          transferSpeed: driveType === "network" ? "1 Gbps" : "5 Gbps",
        })
      }
    } else if (process.platform === "darwin" || process.platform === "linux") {
      // macOS/Linux: listar volumes montados
      let mountPoints = []

      if (process.platform === "darwin") {
        // macOS: diretório /Volumes
        mountPoints = fs.readdirSync("/Volumes").map((mount) => `/Volumes/${mount}`)
      } else {
        // Linux: usar /mnt e /media
        try {
          const mntPoints = fs.readdirSync("/mnt").map((mount) => `/mnt/${mount}`)
          const mediaPoints = fs.existsSync("/media") ? fs.readdirSync("/media").map((mount) => `/media/${mount}`) : []
          mountPoints = [...mntPoints, ...mediaPoints]
        } catch (err) {
          console.error("Erro ao listar pontos de montagem Linux:", err)
        }
      }

      console.log("Pontos de montagem detectados:", mountPoints)

      for (const mountPath of mountPoints) {
        try {
          const stats = diskusage.checkSync(mountPath)
          const name = path.basename(mountPath)
          
          // Converter bytes para TB com precisão
          const totalSpaceTB = stats.total / (1024 * 1024 * 1024 * 1024)
          const freeSpaceTB = stats.free / (1024 * 1024 * 1024 * 1024)

          drives.push({
            id: name,
            name: name,
            path: mountPath,
            connected: true,
            totalSpace: totalSpaceTB,
            freeSpace: freeSpaceTB,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            dateAdded: new Date().toISOString().split("T")[0],
            type: "external",
            serialNumber: `DRIVE-${name}`,
            transferSpeed: "5 Gbps",
          })
        } catch (err) {
          console.error(`Erro ao verificar ${mountPath}:`, err)
        }
      }
    }

    console.log("Drives encontrados:", drives)
    return drives
  } catch (error) {
    console.error("Erro ao obter drives:", error)
    return []
  }
})

// Explorar arquivos em um diretório
ipcMain.handle("explore-directory", async (event, dirPath) => {
  console.log(`Explorando diretório: ${dirPath}`)
  try {
    // Verificar se o diretório existe
    if (!fs.existsSync(dirPath)) {
      console.error(`Diretório não existe: ${dirPath}`)
      return { error: "Diretório não existe" }
    }

    // Verificar se é um diretório
    const stats = fs.statSync(dirPath)
    if (!stats.isDirectory()) {
      console.error(`Não é um diretório: ${dirPath}`)
      return { error: "Não é um diretório" }
    }

    // Ler o conteúdo do diretório
    const files = fs.readdirSync(dirPath)
    const result = []

    for (const file of files) {
      try {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)

        result.push({
          name: file,
          path: filePath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime,
        })
      } catch (err) {
        console.error(`Erro ao processar arquivo ${file}:`, err)
        // Continuar com o próximo arquivo
      }
    }

    console.log(`Encontrados ${result.length} itens em ${dirPath}`)
    return result
  } catch (error) {
    console.error("Erro ao explorar diretório:", error)
    return { error: error.message || "Erro desconhecido" }
  }
})

// Selecionar diretório
ipcMain.handle("select-directory", async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    })

    if (result.canceled) {
      return null
    }

    return result.filePaths[0]
  } catch (err) {
    console.error("Erro ao selecionar diretório:", err)
    return null
  }
})

// Reproduzir arquivo de mídia
ipcMain.handle("play-media", async (event, filePath) => {
  try {
    // Aqui você pode integrar com o player de mídia padrão do sistema
    // ou usar uma biblioteca como electron-media-player
    const { shell } = require("electron")
    shell.openPath(filePath)
    return { success: true }
  } catch (error) {
    console.error("Erro ao reproduzir mídia:", error)
    return { success: false, error: error.message }
  }
})

// Escanear diretório por mídia
ipcMain.handle("scan-media", async (event, dirPath) => {
  console.log(`Escaneando mídia em: ${dirPath}`)
  try {
    const mediaFiles = []
    const videoExtensions = [".mp4", ".mkv", ".avi", ".mov", ".wmv"]

    function scanDir(dir) {
      try {
        const files = fs.readdirSync(dir)

        for (const file of files) {
          try {
            const filePath = path.join(dir, file)
            const stats = fs.statSync(filePath)

            if (stats.isDirectory()) {
              scanDir(filePath)
            } else {
              const ext = path.extname(file).toLowerCase()
              if (videoExtensions.includes(ext)) {
                mediaFiles.push({
                  name: file,
                  path: filePath,
                  size: stats.size,
                  modified: stats.mtime,
                })
              }
            }
          } catch (err) {
            console.error(`Erro ao processar arquivo ${file} em ${dir}:`, err)
            // Continuar com o próximo arquivo
          }
        }
      } catch (err) {
        console.error(`Erro ao ler diretório ${dir}:`, err)
        // Continuar com o próximo diretório
      }
    }

    scanDir(dirPath)
    console.log(`Encontrados ${mediaFiles.length} arquivos de mídia em ${dirPath}`)
    return mediaFiles
  } catch (error) {
    console.error("Erro ao escanear mídia:", error)
    return { error: error.message || "Erro desconhecido" }
  }
})


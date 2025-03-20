const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const diskusage = require('diskusage');

// FunÃ§Ã£o para detectar HDs
async function detectDrives() {
  try {
    const drives = [];

    if (process.platform === "win32") {
      // Windows: listar todas as letras de unidade usando PowerShell
      const command = 'powershell -Command "Get-Volume | Select-Object DriveLetter, FileSystemLabel, SizeRemaining, Size | ConvertTo-Json"';
      const stdout = execSync(command).toString();
      console.log("Drives detectados via PowerShell:", stdout);
      
      // Converter JSON para objeto
      const volumes = JSON.parse(stdout);
      const volumeArray = Array.isArray(volumes) ? volumes : [volumes];
      
      for (const volume of volumeArray) {
        // Pular volumes sem letra
        if (!volume.DriveLetter) {
          continue;
        }
        
        // Obter informaÃ§Ãµes
        const letter = \:;
        const name = volume.FileSystemLabel || Drive \;
        const totalSpaceRaw = volume.Size;
        const freeSpaceRaw = volume.SizeRemaining;
        
        // Se nÃ£o for possÃ­vel analisar os nÃºmeros, pular esse drive
        if (!totalSpaceRaw || !freeSpaceRaw || totalSpaceRaw === 0) {
          continue;
        }
        
        // Converter bytes para TB com precisÃ£o
        const freeSpaceTB = freeSpaceRaw / (1024 * 1024 * 1024 * 1024);
        const totalSpaceTB = totalSpaceRaw / (1024 * 1024 * 1024 * 1024);
        
        // Determinar tipo
        let driveType = "internal";

        drives.push({
          id: letter,
          name: name ? \ (\) : Drive \,
          path: \\\\\,
          connected: true,
          totalSpace: totalSpaceTB,
          freeSpace: freeSpaceTB,
          color: #\,
          dateAdded: new Date().toISOString().split("T")[0],
          type: driveType,
        });
      }
    }

    return drives;
  } catch (error) {
    console.error("Erro ao detectar drives:", error);
    return [];
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  mainWindow.loadFile('test.html');
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(async () => {
  createWindow();
  
  const drives = await detectDrives();
  console.log('\\nDrives encontrados:');
  console.log(JSON.stringify(drives, null, 2));
  
  // Enviar para a janela
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('drives-detected', drives);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

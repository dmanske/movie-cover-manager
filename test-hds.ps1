# Script para testar a funcionalidade de HDs sem o Next.js

Write-Host "Iniciando teste de HDs..." -ForegroundColor Green

# Executa o script de teste direto
Write-Host "Testando detecção de HDs usando PowerShell..." -ForegroundColor Cyan
node electron/direct-test-ps.js

# Configurando para usar o Electron diretamente
Write-Host "`nIniciando o Electron para detecção de HDs..." -ForegroundColor Yellow
$env:NODE_ENV = "development"

# Criar arquivo temporário para testes de Electron
$testContent = @"
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const diskusage = require('diskusage');

// Função para detectar HDs
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
        
        // Obter informações
        const letter = `\${volume.DriveLetter}:`;
        const name = volume.FileSystemLabel || `Drive \${volume.DriveLetter}`;
        const totalSpaceRaw = volume.Size;
        const freeSpaceRaw = volume.SizeRemaining;
        
        // Se não for possível analisar os números, pular esse drive
        if (!totalSpaceRaw || !freeSpaceRaw || totalSpaceRaw === 0) {
          continue;
        }
        
        // Converter bytes para TB com precisão
        const freeSpaceTB = freeSpaceRaw / (1024 * 1024 * 1024 * 1024);
        const totalSpaceTB = totalSpaceRaw / (1024 * 1024 * 1024 * 1024);
        
        // Determinar tipo
        let driveType = "internal";

        drives.push({
          id: letter,
          name: name ? `\${name} (\${letter})` : `Drive \${letter}`,
          path: `\${letter}\\\\`,
          connected: true,
          totalSpace: totalSpaceTB,
          freeSpace: freeSpaceTB,
          color: `#\${Math.floor(Math.random() * 16777215).toString(16)}`,
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
"@

# Criar arquivo HTML para mostrar os resultados
$htmlContent = @"
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Teste de Detecção de HDs</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    .hd-container { display: flex; flex-wrap: wrap; gap: 15px; }
    .hd-card { 
      border: 1px solid #ddd; 
      border-radius: 5px; 
      padding: 15px; 
      width: 300px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .hd-card h2 { margin-top: 0; display: flex; align-items: center; }
    .hd-color { 
      width: 15px; 
      height: 15px; 
      border-radius: 50%;
      display: inline-block;
      margin-right: 10px;
    }
    .progress { 
      height: 10px;
      background-color: #eee;
      border-radius: 5px;
      margin: 10px 0;
      overflow: hidden;
    }
    .progress-bar { 
      height: 100%;
      background-color: #4CAF50;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      color: white;
      background-color: #2196F3;
      margin-left: 10px;
    }
    .details { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Teste de Detecção de HDs</h1>
  <div class="hd-container" id="hd-container">
    <p>Nenhum HD detectado ainda...</p>
  </div>

  <script>
    // Receber os HDs do processo principal
    const { ipcRenderer } = require('electron');
    
    ipcRenderer.on('drives-detected', (event, drives) => {
      console.log('Drives recebidos:', drives);
      displayDrives(drives);
    });
    
    function displayDrives(drives) {
      const container = document.getElementById('hd-container');
      container.innerHTML = '';
      
      if (!drives || drives.length === 0) {
        container.innerHTML = '<p>Nenhum HD detectado.</p>';
        return;
      }
      
      drives.forEach(hd => {
        const usedSpace = hd.totalSpace - hd.freeSpace;
        const usedPercent = Math.round((usedSpace / hd.totalSpace) * 100);
        
        const hdCard = document.createElement('div');
        hdCard.className = 'hd-card';
        
        hdCard.innerHTML = `
          <h2>
            <span class="hd-color" style="background-color: \${hd.color}"></span>
            \${hd.name}
            <span class="badge">\${hd.connected ? 'Conectado' : 'Desconectado'}</span>
          </h2>
          <div class="details">
            <p>Caminho: \${hd.path}</p>
            <p>Tipo: \${hd.type}</p>
            <p>Espaço Total: \${hd.totalSpace.toFixed(2)} TB</p>
            <p>Espaço Livre: \${hd.freeSpace.toFixed(2)} TB</p>
            <p>Espaço Usado: \${usedSpace.toFixed(2)} TB</p>
          </div>
          <div class="progress">
            <div class="progress-bar" style="width: \${usedPercent}%"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span>\${usedPercent}% usado</span>
            <span>\${hd.freeSpace.toFixed(2)} TB livre</span>
          </div>
        `;
        
        container.appendChild(hdCard);
      });
    }
  </script>
</body>
</html>
"@

# Salvar os arquivos temporários
$testElectronJs = "electron/test-app.js"
$testHtmlFile = "test.html"

Write-Host "Criando arquivos temporários para teste..." -ForegroundColor Magenta
$testContent | Out-File -FilePath $testElectronJs -Encoding utf8
$htmlContent | Out-File -FilePath $testHtmlFile -Encoding utf8

# Executar o Electron diretamente com o script de teste
Write-Host "Executando o aplicativo de teste para HDs..." -ForegroundColor Green
npx electron electron/test-app.js

# Remover arquivos temporários após o teste
Remove-Item -Path $testElectronJs
Remove-Item -Path $testHtmlFile

Write-Host "Teste concluído!" -ForegroundColor Green 
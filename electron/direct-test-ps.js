// Teste direto de detecção de HDs no Electron usando PowerShell
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const diskusage = require('diskusage');

console.log('Iniciando teste direto de detecção de HDs usando PowerShell...');

// Função para detectar HDs no Windows usando PowerShell
function detectWindowsDrives() {
  try {
    const drives = [];
    
    // Windows: listar todas as letras de unidade usando PowerShell
    const command = 'powershell -Command "Get-Volume | Select-Object DriveLetter, FileSystemLabel, SizeRemaining, Size | ConvertTo-Json"';
    console.log(`Executando comando: ${command}`);
    
    const stdout = execSync(command).toString();
    console.log('Saída bruta do PowerShell:');
    console.log(stdout);
    
    // Converter JSON para objeto
    const volumes = JSON.parse(stdout);
    const volumeArray = Array.isArray(volumes) ? volumes : [volumes];
    
    console.log(`Número de volumes detectados: ${volumeArray.length}`);
    
    for (const volume of volumeArray) {
      console.log('\nAnalisando volume:', volume);
      
      // Pular volumes sem letra
      if (!volume.DriveLetter) {
        console.log('Pulando - sem letra de drive');
        continue;
      }
      
      // Obter informações
      const letter = `${volume.DriveLetter}:`;
      const name = volume.FileSystemLabel || `Drive ${volume.DriveLetter}`;
      const totalSpaceRaw = volume.Size;
      const freeSpaceRaw = volume.SizeRemaining;
      
      // Se não for possível analisar os números, pular esse drive
      if (!totalSpaceRaw || !freeSpaceRaw || totalSpaceRaw === 0) {
        console.log('Ignorando este drive - valores inválidos');
        continue;
      }
      
      // Converter bytes para TB com precisão
      const freeSpaceTB = freeSpaceRaw / (1024 * 1024 * 1024 * 1024);
      const totalSpaceTB = totalSpaceRaw / (1024 * 1024 * 1024 * 1024);
      console.log(`Letra do drive: ${letter}`);
      console.log(`Nome do drive: ${name}`);
      console.log(`Espaço total (bytes): ${totalSpaceRaw}`);
      console.log(`Espaço livre (bytes): ${freeSpaceRaw}`);
      console.log(`Espaço total (TB): ${totalSpaceTB.toFixed(2)}`);
      console.log(`Espaço livre (TB): ${freeSpaceTB.toFixed(2)}`);
      
      // Obter mais detalhes usando outro comando do PowerShell
      let driveType = "external";
      try {
        const driveInfoCmd = `powershell -Command "Get-WmiObject -Class Win32_LogicalDisk -Filter \\"DeviceID='${letter}'\\" | Select-Object Description | ConvertTo-Json"`;
        const driveInfoOutput = execSync(driveInfoCmd).toString();
        const driveInfo = JSON.parse(driveInfoOutput);
        
        if (driveInfo && driveInfo.Description) {
          const description = driveInfo.Description.toLowerCase();
          if (description.includes("fixed") || description.includes("local")) {
            driveType = "internal";
          } else if (description.includes("removable")) {
            driveType = "external";
          } else if (description.includes("network")) {
            driveType = "network";
          }
        }
      } catch (e) {
        console.log(`Erro ao obter detalhes adicionais do drive: ${e.message}`);
      }
      
      console.log(`Tipo do drive: ${driveType}`);
      
      // Adicionar à lista de drives
      drives.push({
        id: letter,
        name: `${name} (${letter})`,
        path: `${letter}\\`,
        connected: true,
        totalSpace: totalSpaceTB,
        freeSpace: freeSpaceTB,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        dateAdded: new Date().toISOString().split("T")[0],
        type: driveType,
        serialNumber: `DRIVE-${letter.replace(":", "")}`,
        transferSpeed: driveType === "network" ? "1 Gbps" : "5 Gbps",
      });
    }
    
    console.log('\nDrives detectados:');
    console.log(JSON.stringify(drives, null, 2));
    return drives;
  } catch (error) {
    console.error('Erro ao detectar drives:', error);
    return [];
  }
}

// Executar a detecção
detectWindowsDrives();

// Verificar se o diskusage está funcionando para drives específicos
console.log('\nTestando diskusage em drives específicos:');
try {
  const info = diskusage.checkSync('C:\\');
  console.log('Drive C:');
  console.log(`Total: ${(info.total / (1024 * 1024 * 1024 * 1024)).toFixed(4)} TB`);
  console.log(`Livre: ${(info.free / (1024 * 1024 * 1024 * 1024)).toFixed(4)} TB`);
} catch (e) {
  console.error('Erro ao verificar drive C:', e.message);
}

console.log('\nTeste direto concluído!'); 
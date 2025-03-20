// Teste direto de detecção de HDs no Electron
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const diskusage = require('diskusage');

console.log('Iniciando teste direto de detecção de HDs...');

// Função para detectar HDs no Windows
function detectWindowsDrives() {
  try {
    const drives = [];
    
    // Windows: listar todas as letras de unidade
    const stdout = execSync("wmic logicaldisk get caption, volumename, freespace, size, description")
      .toString();
    
    console.log('Saída bruta do WMIC:');
    console.log(stdout);
    
    const lines = stdout.split("\n").filter((line) => line.trim().length > 0);
    console.log(`Número de linhas detectadas: ${lines.length}`);
    
    // Pular a linha de cabeçalho
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      console.log(`\nAnalisando linha ${i}: ${line}`);
      
      // Separar por espaços
      const parts = line.split(/\s+/);
      console.log(`Partes detectadas: ${parts.length}`);
      console.log(parts);
      
      if (parts.length >= 3) {
        // Obter a letra do drive (primeira parte)
        const letter = parts[0];
        console.log(`Letra do drive: ${letter}`);
        
        // Identificar as últimas duas colunas como espaço livre e tamanho total
        const freeSpaceRaw = Number.parseInt(parts[parts.length - 2]);
        const totalSpaceRaw = Number.parseInt(parts[parts.length - 1]);
        console.log(`Espaço livre (bytes): ${freeSpaceRaw}`);
        console.log(`Espaço total (bytes): ${totalSpaceRaw}`);
        
        // Se não for possível analisar os números, pular esse drive
        if (isNaN(freeSpaceRaw) || isNaN(totalSpaceRaw) || totalSpaceRaw === 0) {
          console.log('Ignorando este drive - valores inválidos');
          continue;
        }
        
        // Converter bytes para TB com precisão
        const freeSpaceTB = freeSpaceRaw / (1024 * 1024 * 1024 * 1024);
        const totalSpaceTB = totalSpaceRaw / (1024 * 1024 * 1024 * 1024);
        console.log(`Espaço livre (TB): ${freeSpaceTB.toFixed(2)}`);
        console.log(`Espaço total (TB): ${totalSpaceTB.toFixed(2)}`);
        
        // Determinar um nome para o drive
        let driveName = `Drive ${letter}`;
        // Se houver nome de volume, usar
        for (let j = 1; j < parts.length - 2; j++) {
          if (parts[j] && parts[j] !== "No" && parts[j] !== "Name") {
            driveName = parts[j];
            break;
          }
        }
        console.log(`Nome do drive: ${driveName}`);
        
        // Determinar tipo baseado na descrição ou usar padrão
        let driveType = "external";
        if (line.includes("Fixed") || line.includes("Local")) {
          driveType = "internal";
        } else if (line.includes("Removable")) {
          driveType = "external";
        } else if (line.includes("Network")) {
          driveType = "network";
        }
        console.log(`Tipo do drive: ${driveType}`);
        
        // Adicionar à lista de drives
        drives.push({
          id: letter,
          name: `${driveName} (${letter})`,
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

// Tentar verificar D: se existir
try {
  if (fs.existsSync('D:\\')) {
    const info = diskusage.checkSync('D:\\');
    console.log('Drive D:');
    console.log(`Total: ${(info.total / (1024 * 1024 * 1024 * 1024)).toFixed(4)} TB`);
    console.log(`Livre: ${(info.free / (1024 * 1024 * 1024 * 1024)).toFixed(4)} TB`);
  } else {
    console.log('Drive D: não encontrado');
  }
} catch (e) {
  console.error('Erro ao verificar drive D:', e.message);
}

console.log('\nTeste direto concluído!'); 
// Arquivo para verificar o ambiente do Electron
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('Verificando ambiente...');
console.log(`Node Version: ${process.version}`);
console.log(`Electron: ${process.versions.electron}`);
console.log(`Chrome: ${process.versions.chrome}`);
console.log(`Diretório atual: ${process.cwd()}`);

// Verificar se o preload.js existe
const preloadPath = path.join(__dirname, 'preload.js');
console.log(`Verificando preload.js em: ${preloadPath}`);
if (fs.existsSync(preloadPath)) {
  console.log('preload.js encontrado');
} else {
  console.error('ERRO: preload.js não encontrado!');
}

// Verificar se diskusage está funcionando
try {
  const diskusage = require('diskusage');
  console.log('Módulo diskusage carregado com sucesso');
  
  // Tentar obter informações do disco C:
  const info = diskusage.checkSync('C:\\');
  console.log('Informações do disco C:');
  console.log(`Total: ${(info.total / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`Livre: ${(info.free / (1024 * 1024 * 1024)).toFixed(2)} GB`);
} catch (e) {
  console.error('ERRO ao usar diskusage:', e.message);
}

// Verificar se o servidor Next.js está rodando
console.log('Verificando servidor Next.js...');
http.get('http://localhost:3000', (res) => {
  console.log(`Servidor Next.js está rodando! Status: ${res.statusCode}`);
}).on('error', (e) => {
  console.error(`ERRO: Servidor Next.js não está rodando: ${e.message}`);
});

// Listar diretórios importantes
console.log('\nListando diretórios importantes:');
const rootDir = path.resolve(__dirname, '..');
const dirsToCheck = ['app', 'components', 'electron', 'lib', 'hooks'];

dirsToCheck.forEach(dir => {
  const fullPath = path.join(rootDir, dir);
  console.log(`\nVerificando ${dir}:`);
  
  if (fs.existsSync(fullPath)) {
    try {
      const files = fs.readdirSync(fullPath);
      console.log(`${files.length} arquivos encontrados:`);
      files.slice(0, 5).forEach(file => console.log(`- ${file}`));
      if (files.length > 5) console.log('...');
    } catch (e) {
      console.error(`Erro ao ler diretório ${dir}:`, e.message);
    }
  } else {
    console.error(`Diretório ${dir} não encontrado!`);
  }
}); 
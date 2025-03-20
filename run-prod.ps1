# Script PowerShell para iniciar o aplicativo em modo de produção

Write-Host "Construindo o aplicativo Next.js..." -ForegroundColor Green
npm run build

Write-Host "Iniciando o servidor Next.js em modo de produção..." -ForegroundColor Green
Start-Process powershell -ArgumentList "npm run start" -WindowStyle Normal

Write-Host "Aguardando 5 segundos para o servidor iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Iniciando o Electron..." -ForegroundColor Green
$env:NODE_ENV = "production"
Start-Process powershell -ArgumentList "npx electron ." -WindowStyle Normal

Write-Host "Aplicativo iniciado em modo de produção!" -ForegroundColor Green 
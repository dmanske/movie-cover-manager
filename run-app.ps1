# Script PowerShell para iniciar o aplicativo

Write-Host "Iniciando o servidor Next.js..." -ForegroundColor Green
Start-Process powershell -ArgumentList "npm run dev" -WindowStyle Normal

Write-Host "Aguardando 8 segundos para o servidor iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "Verificando o ambiente..." -ForegroundColor Cyan
node electron/check-env.js

Write-Host "Iniciando o Electron..." -ForegroundColor Green
$env:NODE_ENV = "development"
Start-Process powershell -ArgumentList "npx electron ." -WindowStyle Normal

Write-Host "Aplicativo iniciado!" -ForegroundColor Green 
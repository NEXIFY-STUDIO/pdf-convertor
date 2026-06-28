@echo off
setlocal
cd /d "%~dp0.."

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js nie je nainstalovany. Nainstaluj Node 24 LTS z https://nodejs.org/
  pause
  exit /b 1
)

if not exist ".env.local" (
  copy "win11\.env.example" ".env.local"
  echo Vytvorene .env.local - dopln TAILSCALE_SECRET a VITE_MISTRAL_API_KEY
)

echo Instalujem zavislosti...
call npm ci
if errorlevel 1 (
  echo npm ci zlyhalo, skusam npm install...
  call npm install
)

echo Buildujem produkciu...
call npm run build
if errorlevel 1 (
  echo Build zlyhal.
  pause
  exit /b 1
)

echo Hotovo. Spusti win11\START-PROXY.bat a win11\TAILSCALE-SERVE.bat
pause
@echo off
setlocal
cd /d "%~dp0.."

if not exist ".env.local" (
  if exist "win11\.env.example" copy "win11\.env.example" ".env.local"
  echo Vytvorene .env.local - dopln TAILSCALE_SECRET a VITE_MISTRAL_API_KEY
)

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js nie je nainstalovany. Nainstaluj Node 24 LTS z https://nodejs.org/
  pause
  exit /b 1
)

echo Spustam Tailscale proxy na http://127.0.0.1:4180 ...
node scripts/tailscale-vercel-proxy.mjs
pause
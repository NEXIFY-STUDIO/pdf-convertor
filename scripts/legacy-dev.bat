@echo off
setlocal
set ROOT=%~dp0..
set LEGACY=%ROOT%-legacy
set COMMIT=8bce4acf03498d0660f02e17bde6704bbb0bd3cb
set PORT=5174

cd /d "%ROOT%"

if not exist "%LEGACY%" (
  echo Vytvaram worktree: %LEGACY%
  git worktree add "%LEGACY%" %COMMIT%
) else (
  echo Worktree uz existuje: %LEGACY%
)

cd /d "%LEGACY%"
git log -1 --oneline

if not exist "node_modules" (
  echo npm install...
  call npm install
)

echo.
echo Dev server starsia verzia: http://localhost:%PORT%/
npm run dev -- --host 127.0.0.1 --port %PORT%
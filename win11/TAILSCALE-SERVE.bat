@echo off
where tailscale >nul 2>&1
if errorlevel 1 (
  echo Tailscale CLI nie je nainstalovany. Stiahni z https://tailscale.com/download/windows
  pause
  exit /b 1
)

echo Nastavujem Tailscale serve: /vub -> http://127.0.0.1:4180
tailscale serve --set-path=/vub --bg http://127.0.0.1:4180
tailscale serve status
echo.
echo Otvor v prehliadaci: https://TVOJ-NODE.tailXXXXX.ts.net/vub
pause
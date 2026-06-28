# Vytvori releases/vub-statement-generator-win11-v2.zip
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $root "releases"
$staging = Join-Path $env:TEMP "vub-win11-staging"
$zipName = "vub-statement-generator-win11-v2.zip"
$zipPath = Join-Path $releaseDir $zipName

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

$items = @(
  "dist",
  "scripts/tailscale-vercel-proxy.mjs",
  "win11/.env.example",
  "win11/START-PROXY.bat",
  "win11/TAILSCALE-SERVE.bat",
  "win11/INSTALL.bat",
  "win11/README-WIN11.txt"
)

foreach ($item in $items) {
  $src = Join-Path $root $item
  if (-not (Test-Path $src)) { throw "Missing: $item" }
  $dest = Join-Path $staging $item
  $destParent = Split-Path $dest -Parent
  if (-not (Test-Path $destParent)) { New-Item -ItemType Directory -Path $destParent -Force | Out-Null }
  if (Test-Path $src -PathType Container) {
    Copy-Item $src $dest -Recurse -Force
  } else {
    Copy-Item $src $dest -Force
  }
}

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force
Remove-Item $staging -Recurse -Force
Write-Host "Created $zipPath"
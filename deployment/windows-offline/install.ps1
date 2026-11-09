#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$InstallRoot = 'C:\InSightCare\FE',

  [ValidateRange(1, 65535)]
  [int]$AppPort = 3000,

  [switch]$SkipFirewall
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Run this script from PowerShell as Administrator.'
}

$BundleRoot = $PSScriptRoot
$requiredPaths = @(
  (Join-Path $BundleRoot 'app\server.js'),
  (Join-Path $BundleRoot 'app\InSightCare-FE.exe'),
  (Join-Path $BundleRoot 'app\InSightCare-FE.xml'),
  (Join-Path $BundleRoot 'runtime\node.exe')
)

foreach ($requiredPath in $requiredPaths) {
  if (-not (Test-Path -LiteralPath $requiredPath)) {
    throw "Bundle is incomplete. Missing: $requiredPath"
  }
}

New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
robocopy $BundleRoot $InstallRoot /E /XD .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) {
  throw "robocopy failed with exit code $LASTEXITCODE."
}

$app = Join-Path $InstallRoot 'app'
$exe = Join-Path $app 'InSightCare-FE.exe'
$xmlPath = Join-Path $app 'InSightCare-FE.xml'
New-Item -ItemType Directory -Force -Path (Join-Path $app 'logs') | Out-Null

$serviceXml = Get-Content -Raw -LiteralPath $xmlPath
$serviceXml = [regex]::Replace(
  $serviceXml,
  '(?<=<env name="PORT" value=")[^"]+(?="/>)',
  [string]$AppPort
)
Set-Content -LiteralPath $xmlPath -Value $serviceXml -Encoding UTF8

if (-not $SkipFirewall) {
  $rule = "InSightCare-FE $AppPort"
  Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue |
    Remove-NetFirewallRule
  New-NetFirewallRule `
    -DisplayName $rule `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $AppPort `
    -Action Allow | Out-Null
}

Push-Location $app
try {
  $existing = Get-Service -Name 'InSightCare-FE' -ErrorAction SilentlyContinue
  if ($existing) {
    & $exe stop
    & $exe uninstall
  }

  & $exe install
  if ($LASTEXITCODE -ne 0) {
    throw "WinSW install failed with exit code $LASTEXITCODE."
  }

  & $exe start
  if ($LASTEXITCODE -ne 0) {
    throw "WinSW start failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}

Start-Sleep -Seconds 3
sc.exe query InSightCare-FE
Write-Host "FE should be at http://127.0.0.1:$AppPort"
Write-Host "Install root: $InstallRoot"

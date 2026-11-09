#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$InstallRoot = 'C:\InSightCare\FE',

  [switch]$KeepFiles,

  [switch]$KeepFirewall
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Run this script from PowerShell as Administrator.'
}

$exe = Join-Path $InstallRoot 'app\InSightCare-FE.exe'
$service = Get-Service -Name 'InSightCare-FE' -ErrorAction SilentlyContinue

if ($service) {
  if (Test-Path -LiteralPath $exe) {
    Push-Location (Split-Path -Parent $exe)
    try {
      if ($service.Status -ne 'Stopped') {
        & $exe stop
      }
      & $exe uninstall
    } finally {
      Pop-Location
    }
  } else {
    if ($service.Status -ne 'Stopped') {
      Stop-Service -Name 'InSightCare-FE' -Force
    }
    sc.exe delete 'InSightCare-FE' | Out-Null
  }
}

if (-not $KeepFirewall) {
  Get-NetFirewallRule -DisplayName 'InSightCare-FE *' -ErrorAction SilentlyContinue |
    Remove-NetFirewallRule
}

if (-not $KeepFiles -and (Test-Path -LiteralPath $InstallRoot)) {
  Remove-Item -LiteralPath $InstallRoot -Recurse -Force
}

Write-Host 'InSightCare-FE service was removed.'

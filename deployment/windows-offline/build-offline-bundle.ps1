#Requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidatePattern('^https?://')]
  [string]$ApiUrl,

  [ValidateRange(1, 65535)]
  [int]$Port = 3000,

  [string]$NodeVersion,

  [string]$WinSWVersion = '2.12.0',

  [string]$OutputDirectory,

  [switch]$SkipVcRedist
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-ExternalCommand {
  param(
    [Parameter(Mandatory)]
    [string]$Executable,

    [Parameter(Mandatory)]
    [string[]]$Arguments
  )

  & $Executable @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Executable failed with exit code $LASTEXITCODE."
  }
}

function Get-JsonProperty {
  param(
    $InputObject,

    [Parameter(Mandatory)]
    [string]$Name
  )

  if (-not $InputObject) {
    return $null
  }

  $property = $InputObject.PSObject.Properties[$Name]
  if (-not $property) {
    return $null
  }

  return $property.Value
}

function Get-Download {
  param(
    [Parameter(Mandatory)]
    [string]$Url,

    [Parameter(Mandatory)]
    [string]$Destination
  )

  if (Test-Path -LiteralPath $Destination) {
    return
  }

  Write-Host "Downloading $Url"
  Invoke-WebRequest -Uri $Url -OutFile $Destination -UseBasicParsing
}

if (-not [Environment]::Is64BitOperatingSystem) {
  throw 'The offline bundle must be built on Windows x64.'
}

if (-not (Get-Command 'yarn.cmd' -ErrorAction SilentlyContinue)) {
  throw 'yarn.cmd was not found. Install Yarn 1.x on the online build machine.'
}

if (-not (Get-Command 'node.exe' -ErrorAction SilentlyContinue)) {
  throw 'node.exe was not found.'
}

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$packageJsonPath = Join-Path $repositoryRoot 'package.json'
$yarnLockPath = Join-Path $repositoryRoot 'yarn.lock'
if (-not (Test-Path -LiteralPath $packageJsonPath) -or -not (Test-Path -LiteralPath $yarnLockPath)) {
  throw 'package.json or yarn.lock is missing.'
}

$nextConfigPath = Join-Path $repositoryRoot 'next.config.js'
$nextConfigText = Get-Content -Raw -LiteralPath $nextConfigPath
if ($nextConfigText -notmatch "output\s*:\s*['`"]standalone['`"]") {
  throw 'next.config.js must set output: ''standalone'' before building the offline bundle.'
}

if (-not $NodeVersion) {
  $NodeVersion = (& node.exe --version).TrimStart('v').Trim()
}

if ($NodeVersion -notmatch '^\d+\.\d+\.\d+$') {
  throw "Invalid NodeVersion: $NodeVersion"
}

$resolvedApiUrl = [Uri]$ApiUrl
if (-not $resolvedApiUrl.IsAbsoluteUri -or $resolvedApiUrl.Scheme -notin @('http', 'https')) {
  throw "ApiUrl must be an absolute HTTP(S) URL: $ApiUrl"
}
$ApiUrl = $ApiUrl.TrimEnd('/')

if (-not $OutputDirectory) {
  $OutputDirectory = Join-Path $repositoryRoot 'dist-offline'
}
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)

$cacheDirectory = Join-Path $PSScriptRoot '.cache'
$workDirectory = Join-Path $OutputDirectory '.work'
$bundleName = 'InSightCare-FE-offline'
$bundleDirectory = Join-Path $OutputDirectory $bundleName
$zipPath = Join-Path $OutputDirectory "$bundleName.zip"

New-Item -ItemType Directory -Force -Path $cacheDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

foreach ($path in @($workDirectory, $bundleDirectory, $zipPath)) {
  if (Test-Path -LiteralPath $path) {
    Remove-Item -LiteralPath $path -Recurse -Force
  }
}

New-Item -ItemType Directory -Force -Path $workDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $bundleDirectory | Out-Null

$previousApiUrl = $env:NEXT_PUBLIC_API_URL
$previousNodeEnv = $env:NODE_ENV
$envProductionPath = Join-Path $repositoryRoot '.env.production'
$createdEnvProduction = $false

try {
  Push-Location $repositoryRoot
  try {
    Write-Host 'Installing locked dependencies...'
    Invoke-ExternalCommand -Executable 'yarn.cmd' -Arguments @(
      'install',
      '--frozen-lockfile',
      '--non-interactive'
    )

    $envProductionContent = @(
      "NEXT_PUBLIC_API_URL=$ApiUrl"
      "FE_PORT=$Port"
    ) -join [Environment]::NewLine

    if (-not (Test-Path -LiteralPath $envProductionPath)) {
      Set-Content -LiteralPath $envProductionPath -Value $envProductionContent -Encoding UTF8
      $createdEnvProduction = $true
    } else {
      Set-Content -LiteralPath $envProductionPath -Value $envProductionContent -Encoding UTF8
    }

    Write-Host "Building Next.js standalone with NEXT_PUBLIC_API_URL=$ApiUrl"
    $env:NEXT_PUBLIC_API_URL = $ApiUrl
    $env:NODE_ENV = 'production'
    Invoke-ExternalCommand -Executable 'yarn.cmd' -Arguments @('build')
  } finally {
    Pop-Location
  }

  $standaloneDirectory = Join-Path $repositoryRoot '.next\standalone'
  $staticDirectory = Join-Path $repositoryRoot '.next\static'
  if (-not (Test-Path -LiteralPath (Join-Path $standaloneDirectory 'server.js'))) {
    throw 'Standalone build is missing .next\standalone\server.js'
  }
  if (-not (Test-Path -LiteralPath $staticDirectory)) {
    throw 'Standalone build is missing .next\static'
  }

  $appDirectory = Join-Path $bundleDirectory 'app'
  New-Item -ItemType Directory -Force -Path $appDirectory | Out-Null
  Copy-Item -Path (Join-Path $standaloneDirectory '*') -Destination $appDirectory -Recurse -Force

  $appStaticDirectory = Join-Path $appDirectory '.next\static'
  New-Item -ItemType Directory -Force -Path $appStaticDirectory | Out-Null
  Copy-Item -Path (Join-Path $staticDirectory '*') -Destination $appStaticDirectory -Recurse -Force

  $appPublicDirectory = Join-Path $appDirectory 'public'
  New-Item -ItemType Directory -Force -Path $appPublicDirectory | Out-Null
  $publicDirectory = Join-Path $repositoryRoot 'public'
  if (Test-Path -LiteralPath $publicDirectory) {
    Copy-Item -Path (Join-Path $publicDirectory '*') -Destination $appPublicDirectory -Recurse -Force -ErrorAction SilentlyContinue
  }

  New-Item -ItemType Directory -Force -Path (Join-Path $appDirectory 'logs') | Out-Null

  $nodeArchiveName = "node-v$NodeVersion-win-x64.zip"
  $nodeArchivePath = Join-Path $cacheDirectory $nodeArchiveName
  $nodeExtractDirectory = Join-Path $workDirectory 'node'
  Get-Download `
    -Url "https://nodejs.org/dist/v$NodeVersion/$nodeArchiveName" `
    -Destination $nodeArchivePath
  Expand-Archive -Path $nodeArchivePath -DestinationPath $nodeExtractDirectory -Force

  $nodeSourceDirectory = Join-Path $nodeExtractDirectory "node-v$NodeVersion-win-x64"
  $runtimeDirectory = Join-Path $bundleDirectory 'runtime'
  New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null
  Copy-Item -Path (Join-Path $nodeSourceDirectory '*') -Destination $runtimeDirectory -Recurse -Force

  if (-not (Test-Path -LiteralPath (Join-Path $runtimeDirectory 'node.exe'))) {
    throw 'Node portable layout is unexpected: runtime\node.exe is missing.'
  }

  $winSWPath = Join-Path $cacheDirectory "WinSW-x64-$WinSWVersion.exe"
  Get-Download `
    -Url "https://github.com/winsw/winsw/releases/download/v$WinSWVersion/WinSW-x64.exe" `
    -Destination $winSWPath
  Copy-Item -Force $winSWPath (Join-Path $appDirectory 'InSightCare-FE.exe')

  $serviceTemplatePath = Join-Path $PSScriptRoot 'service\InSightCare-FE.xml.template'
  $serviceXml = (Get-Content -Raw -LiteralPath $serviceTemplatePath).Replace('__FE_PORT__', [string]$Port)
  Set-Content `
    -LiteralPath (Join-Path $appDirectory 'InSightCare-FE.xml') `
    -Value $serviceXml `
    -Encoding UTF8

  if (-not $SkipVcRedist) {
    $prerequisitesDirectory = Join-Path $bundleDirectory 'prerequisites'
    New-Item -ItemType Directory -Force -Path $prerequisitesDirectory | Out-Null
    $vcRedistPath = Join-Path $cacheDirectory 'vc_redist.x64.exe'
    Get-Download `
      -Url 'https://aka.ms/vs/17/release/vc_redist.x64.exe' `
      -Destination $vcRedistPath
    Copy-Item -Force $vcRedistPath $prerequisitesDirectory
  }

  Copy-Item -Force (Join-Path $PSScriptRoot 'install.ps1') $bundleDirectory
  Copy-Item -Force (Join-Path $PSScriptRoot 'uninstall.ps1') $bundleDirectory
  Copy-Item -Force (Join-Path $PSScriptRoot 'smoke-test.ps1') $bundleDirectory
  Copy-Item -Force (Join-Path $PSScriptRoot '.env.production.template') $bundleDirectory
  Copy-Item -Force (Join-Path $PSScriptRoot 'README-INSTALL-VI.md') $bundleDirectory

  $packageJson = Get-Content -Raw -LiteralPath $packageJsonPath | ConvertFrom-Json
  $manifest = [ordered]@{
    application = 'InSight-Care-FE'
    packageVersion = Get-JsonProperty -InputObject $packageJson -Name 'version'
    nextVersion = Get-JsonProperty -InputObject $packageJson.dependencies -Name 'next'
    nodeVersion = $NodeVersion
    architecture = 'win-x64'
    runtime = 'standalone'
    startCommand = 'node server.js'
    frontendPort = $Port
    publicApiUrl = $ApiUrl
    builtAtUtc = [DateTime]::UtcNow.ToString('o')
    buildMachine = $env:COMPUTERNAME
  }
  $manifest |
    ConvertTo-Json |
    Set-Content -LiteralPath (Join-Path $bundleDirectory 'bundle-manifest.json') -Encoding UTF8

  Remove-Item -LiteralPath $workDirectory -Recurse -Force
  Compress-Archive -Path $bundleDirectory -DestinationPath $zipPath -CompressionLevel Optimal

  Write-Host "Bundle directory: $bundleDirectory"
  Write-Host "Offline ZIP: $zipPath"
} finally {
  $env:NEXT_PUBLIC_API_URL = $previousApiUrl
  $env:NODE_ENV = $previousNodeEnv

  if ($createdEnvProduction -and (Test-Path -LiteralPath $envProductionPath)) {
    Remove-Item -LiteralPath $envProductionPath -Force
  }

  if (Test-Path -LiteralPath $workDirectory) {
    Remove-Item -LiteralPath $workDirectory -Recurse -Force
  }
}

#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$FrontendBaseUrl = 'http://127.0.0.1:3000',

  [string]$BackendBaseUrl,

  [switch]$TestAdminLogin
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-HealthCheck {
  param(
    [string]$Name,
    [string]$Url
  )

  $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
  if ($response.StatusCode -ne 200) {
    throw "$Name returned HTTP $($response.StatusCode): $Url"
  }

  Write-Host "[OK] $Name - HTTP $($response.StatusCode)"
  return $response
}

$frontendUrl = $FrontendBaseUrl.TrimEnd('/')
$backendUrl = if ($BackendBaseUrl) { $BackendBaseUrl.TrimEnd('/') } else { $null }

Invoke-HealthCheck -Name 'Frontend root' -Url "$frontendUrl/" | Out-Null
Invoke-HealthCheck -Name 'Frontend login page' -Url "$frontendUrl/login" | Out-Null

$healthResponse = Invoke-HealthCheck -Name 'Frontend health endpoint' -Url "$frontendUrl/api/health"
$healthPayload = $healthResponse.Content | ConvertFrom-Json
if ($healthPayload.status -ne 'ok') {
  throw 'Frontend health endpoint did not return status=ok.'
}

if ($backendUrl) {
  try {
    $corsResponse = Invoke-WebRequest `
      -Uri "$backendUrl/auth/login" `
      -Method Options `
      -Headers @{
        Origin = $frontendUrl
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'content-type'
      } `
      -UseBasicParsing `
      -TimeoutSec 15

    $allowedOrigin = $corsResponse.Headers['Access-Control-Allow-Origin']
    if ($allowedOrigin -notin @('*', $frontendUrl)) {
      throw "BE CORS does not allow origin $frontendUrl."
    }

    Write-Host "[OK] Backend CORS allows $frontendUrl"
  } catch {
    throw "Backend CORS preflight failed: $($_.Exception.Message)"
  }
}

if ($TestAdminLogin) {
  if (-not $backendUrl) {
    throw 'BackendBaseUrl is required with TestAdminLogin.'
  }

  $credential = Get-Credential -Message 'Enter an admin account for the one-time login smoke test'
  $body = @{
    username = $credential.UserName
    password = $credential.GetNetworkCredential().Password
  } | ConvertTo-Json

  $loginResponse = Invoke-WebRequest `
    -Uri "$backendUrl/auth/login" `
    -Method Post `
    -ContentType 'application/json; charset=utf-8' `
    -Body $body `
    -UseBasicParsing `
    -TimeoutSec 15

  if ($loginResponse.StatusCode -notin @(200, 201)) {
    throw "Admin login returned HTTP $($loginResponse.StatusCode)."
  }

  Write-Host '[OK] Admin login succeeded. Credentials and token were not saved.'
}

Write-Host 'Smoke test completed successfully.'

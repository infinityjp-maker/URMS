# URMS dev verification — run after completing work (honest checks)
$ErrorActionPreference = "Stop"

function Test-Url {
  param([string]$Url)
  $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
  return $resp.StatusCode
}

function Test-UrlBody {
  param([string]$Url)
  $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
  return @{ Status = $resp.StatusCode; Body = $resp.Content }
}

$fail = 0
$warn = 0

# 1. Web UI shell (HTML must contain root mount point)
try {
  $web = Test-UrlBody "http://localhost:5173/"
  if ($web.Status -ge 200 -and $web.Status -lt 400 -and $web.Body -match 'id="root"') {
    Write-Host "[OK] Web UI shell http://localhost:5173/ (page loads)"
  } else {
    Write-Host "[NG] Web UI shell http://localhost:5173/"
    $fail++
  }
} catch {
  Write-Host "[NG] Web UI shell http://localhost:5173/ — not running"
  $fail++
}

# 2. API health
try {
  $code = Test-Url "http://localhost:3000/health"
  if ($code -ge 200 -and $code -lt 400) {
    Write-Host "[OK] API health http://localhost:3000/health"
  } else {
    Write-Host "[NG] API health HTTP $code"
    $fail++
  }
} catch {
  Write-Host "[NG] API health http://localhost:3000/health — not running"
  $fail++
}

# 3. API readiness (DB) — warn if not ready; do not claim all OK
try {
  $readyBody = & curl.exe -s "http://localhost:3000/health/ready"
  if ($readyBody -match '"status"\s*:\s*"ready"') {
    Write-Host "[OK] API readiness /health/ready (DB connected)"
  } elseif ($readyBody -match 'not_ready|unavailable') {
    Write-Host "[WARN] API readiness /health/ready — DB not available (Resource save will fail)"
    Write-Host "       Without Docker/PostgreSQL this is expected. Wireframes (5180) still work."
    $warn++
  } else {
    Write-Host "[NG] API readiness /health/ready — unexpected response"
    $fail++
  }
} catch {
  Write-Host "[WARN] API readiness /health/ready — request failed"
  $warn++
}

# 4. Wireframes (works without DB)
try {
  $code = Test-Url "http://localhost:5180/"
  if ($code -ge 200 -and $code -lt 400) {
    Write-Host "[OK] Wireframes http://localhost:5180/"
  } else {
    Write-Host "[NG] Wireframes HTTP $code"
    $fail++
  }
} catch {
  Write-Host "[NG] Wireframes http://localhost:5180/ — not running"
  $fail++
}

Write-Host ""
if ($fail -gt 0) {
  Write-Host "FAILED: $fail critical check(s). Start servers: scripts/launch/start-dev-servers.bat"
  exit 1
}

if ($warn -gt 0) {
  Write-Host "PASSED with $warn warning(s)."
  Write-Host "Web UI opens but data features need PostgreSQL (Docker). Design review: http://localhost:5180/"
  exit 0
}

Write-Host "ALL OK — Web UI and API data both working."
exit 0

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

# 1. API health
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

# 2. API readiness (DB) — warn if not ready; do not claim all OK
try {
  $readyBody = & curl.exe -s "http://localhost:3000/health/ready"
  if ($readyBody -match '"status"\s*:\s*"ready"') {
    Write-Host "[OK] API readiness /health/ready (DB connected)"
  } elseif ($readyBody -match 'not_ready|unavailable') {
    Write-Host "[WARN] API readiness /health/ready — DB not available (Resource save will fail)"
    Write-Host "       Without Docker/PostgreSQL this is expected. Product UI (1420) still works."
    $warn++
  } else {
    Write-Host "[NG] API readiness /health/ready — unexpected response"
    $fail++
  }
} catch {
  Write-Host "[WARN] API readiness /health/ready — request failed"
  $warn++
}

# 3. Desktop UI web shell (1420) — product UI dev
try {
  $desk = Test-UrlBody "http://localhost:1420/"
  if ($desk.Status -ge 200 -and $desk.Status -lt 400 -and $desk.Body -match 'id="root"') {
    Write-Host "[OK] Desktop UI shell http://localhost:1420/ (製品 UI)"
  } else {
    Write-Host "[NG] Desktop UI shell http://localhost:1420/ — unexpected response"
    $fail++
  }
} catch {
  Write-Host "[NG] Desktop UI shell http://localhost:1420/ — not running"
  Write-Host "       Start: scripts/launch/start-dev-servers.bat"
  $fail++
}

# 4. Schedule month API (S3 — hub calendar data)
if ($fail -eq 0) {
  try {
    $schedBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/schedule/month?year=2026&month=7"
    if ($schedBody -match '"days"') {
      Write-Host "[OK] Schedule month GET /v1/schedule/month (hub calendar)"
    } else {
      Write-Host "[NG] Schedule month GET /v1/schedule/month — unexpected response"
      $fail++
    }
  } catch {
    Write-Host "[NG] Schedule month GET /v1/schedule/month — request failed"
    $fail++
  }
}

# 5. Perception (hub weather · context)
if ($fail -eq 0) {
  try {
    $perceptionBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/perception"
    if ($perceptionBody -match '"weather":"live"') {
      Write-Host "[OK] Perception GET /v1/perception (weather live)"
    } elseif ($perceptionBody -match 'INTERNAL_ERROR|export_content_hash') {
      Write-Host "[NG] Perception GET /v1/perception - DB schema mismatch? Run: pnpm db:migrate"
      $fail++
    } else {
      Write-Host "[WARN] Perception GET /v1/perception - weather empty (Open-Meteo / location SSOT)"
      $warn++
    }
  } catch {
    Write-Host "[NG] Perception GET /v1/perception — request failed"
    $fail++
  }

  try {
    $transportBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/transport/departure"
    if ($transportBody -match '"stationName"') {
      Write-Host "[OK] Transport GET /v1/transport/departure (S4 departure)"
    } else {
      Write-Host "[NG] Transport GET /v1/transport/departure — unexpected response"
      $fail++
    }
  } catch {
    Write-Host "[NG] Transport GET /v1/transport/departure — request failed"
    $fail++
  }

  try {
    $opsBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/operations/flows"
    if ($opsBody -match '"alertCount"') {
      Write-Host "[OK] Operations GET /v1/operations/flows (S5)"
    } else {
      Write-Host "[NG] Operations GET /v1/operations/flows — unexpected response"
      $fail++
    }
  } catch {
    Write-Host "[NG] Operations GET /v1/operations/flows — request failed"
    $fail++
  }

  try {
    $googleBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/schedule/google/status"
    if ($googleBody -match '"connected"') {
      Write-Host "[OK] Google Calendar GET /v1/schedule/google/status (S3)"
    } else {
      Write-Host "[NG] Google Calendar GET /v1/schedule/google/status — unexpected response"
      $fail++
    }
  } catch {
    Write-Host "[NG] Google Calendar GET /v1/schedule/google/status — request failed"
    $fail++
  }

  try {
    $knowledgeBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/knowledge/documents"
    if ($knowledgeBody -match '"documents"') {
      Write-Host "[OK] Knowledge GET /v1/knowledge/documents (S6)"
    } else {
      Write-Host "[NG] Knowledge GET /v1/knowledge/documents — unexpected response"
      $fail++
    }
  } catch {
    Write-Host "[NG] Knowledge GET /v1/knowledge/documents — request failed"
    $fail++
  }

  try {
    $assetsBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/assets"
    if ($assetsBody -match '"assets"') {
      Write-Host "[OK] Assets GET /v1/assets (S7)"
    } else {
      Write-Host "[NG] Assets GET /v1/assets — unexpected response"
      $fail++
    }
  } catch {
    Write-Host "[NG] Assets GET /v1/assets — request failed"
    $fail++
  }

  try {
    $weeklyBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/weather/weekly"
    if ($weeklyBody -match '"days"') {
      Write-Host "[OK] Weather weekly GET /v1/weather/weekly (M-WEA-WK)"
    } else {
      Write-Host "[NG] Weather weekly GET /v1/weather/weekly — unexpected response"
      $fail++
    }
  } catch {
    Write-Host "[NG] Weather weekly GET /v1/weather/weekly — request failed"
    $fail++
  }

  try {
    $hourlyBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/weather/hourly"
    if ($hourlyBody -match '"slots"') {
      Write-Host "[OK] Weather hourly GET /v1/weather/hourly (M-WEA-DET)"
    } else {
      Write-Host "[NG] Weather hourly GET /v1/weather/hourly — unexpected response"
      $fail++
    }
  } catch {
    Write-Host "[NG] Weather hourly GET /v1/weather/hourly — request failed"
    $fail++
  }

  try {
    $storageBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/storage/overview"
    if ($storageBody -match '"volumes"') {
      Write-Host "[OK] Storage GET /v1/storage/overview (S8)"
    } else {
      Write-Host "[NG] Storage GET /v1/storage/overview — unexpected response"
      $fail++
    }
  } catch {
    Write-Host "[NG] Storage GET /v1/storage/overview — request failed"
    $fail++
  }

  try {
    $videoBody = & curl.exe -s -H "X-URMS-Mode: operate" "http://localhost:3000/v1/videos/library"
    if ($videoBody -match '"items"') {
      Write-Host "[OK] Video GET /v1/videos/library (S9)"
    } else {
      Write-Host "[NG] Video GET /v1/videos/library — unexpected response"
      $fail++
    }
  } catch {
    Write-Host "[NG] Video GET /v1/videos/library — request failed"
    $fail++
  }
}

Write-Host ""
if ($fail -gt 0) {
  Write-Host "FAILED: $fail critical check(s). Start servers: scripts/launch/start-dev-servers.bat"
  exit 1
}

if ($warn -gt 0) {
  Write-Host "PASSED with $warn warning(s)."
  Write-Host "Product UI opens at http://localhost:1420/ — data features need PostgreSQL (Docker)."
  exit 0
}

Write-Host "ALL OK — Product UI and API data both working."
exit 0

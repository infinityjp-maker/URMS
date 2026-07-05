# URMS S13 security audit — dependency + secret pattern scan
$ErrorActionPreference = "Continue"

Write-Host "=== URMS Security Audit (S13) ==="

$fail = 0
$warn = 0

Write-Host "`n[1] pnpm audit (high+)"
try {
  Push-Location $PSScriptRoot\..\..
  $audit = npx pnpm@9.15.4 audit --audit-level=high 2>&1
  $code = $LASTEXITCODE
  Pop-Location
  if ($code -eq 0) {
    Write-Host "[OK] No high/critical vulnerabilities"
  } else {
    Write-Host "[WARN] pnpm audit reported issues (review output)"
    Write-Host $audit
    $warn++
  }
} catch {
  Write-Host "[WARN] pnpm audit failed: $_"
  $warn++
}

Write-Host "`n[2] Hardcoded secret patterns (apps/, packages/)"
$patterns = @(
  'password\s*=\s*["''][^"'']+["'']',
  'api[_-]?key\s*=\s*["''][^"'']+["'']',
  'JWT_SECRET\s*=\s*["''][^"'']+["'']'
)
$root = Join-Path $PSScriptRoot "..\.."
$scanPaths = @(
  (Join-Path $root "apps"),
  (Join-Path $root "packages")
)
$hits = 0
foreach ($path in $scanPaths) {
  if (-not (Test-Path $path)) { continue }
  foreach ($pattern in $patterns) {
    $matches = Get-ChildItem -Path $path -Recurse -Include *.ts,*.tsx,*.js,*.mjs -File -ErrorAction SilentlyContinue |
      Select-String -Pattern $pattern -SimpleMatch:$false |
      Where-Object { $_.Path -notmatch 'node_modules|\.test\.|mock' }
    if ($matches) {
      $hits += $matches.Count
      Write-Host "[WARN] Pattern '$pattern' in:"
      $matches | ForEach-Object { Write-Host "       $($_.Path):$($_.LineNumber)" }
    }
  }
}
if ($hits -eq 0) {
  Write-Host "[OK] No obvious hardcoded secrets in source scan"
} else {
  $warn++
}

Write-Host "`n[3] Security plugins registered"
$securityFile = Join-Path $root "apps\api\src\plugins\security.ts"
if (Test-Path $securityFile) {
  Write-Host "[OK] apps/api/src/plugins/security.ts exists"
} else {
  Write-Host "[NG] security plugin missing"
  $fail++
}

Write-Host ""
if ($fail -gt 0) {
  Write-Host "FAILED: $fail critical issue(s)"
  exit 1
}
Write-Host "PASSED with $warn warning(s)."
exit 0

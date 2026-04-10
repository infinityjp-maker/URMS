$outdir = '.gh-run-scripts/actions_account_check'
New-Item -ItemType Directory -Force -Path $outdir | Out-Null

function Save-Api([string]$path, [string]$outFile) {
  Write-Output "gh api $path -> $outFile"
  try {
    gh api $path 2> "$outdir/$outFile.err" | Out-File -FilePath "$outdir/$outFile" -Encoding utf8
  } catch {
    Write-Output "API call failed: $path -> $_"
  }
}

# Endpoints to query
$calls = @(
  @{ path = 'user'; file = 'user.json' },
  @{ path = 'user/actions/permissions'; file = 'user_actions_permissions.json' },
  @{ path = 'user/actions/runners'; file = 'user_actions_runners.json' },
  @{ path = 'user/settings/billing/actions'; file = 'user_billing_actions.json' },
  @{ path = 'user/actions/permissions/workflow'; file = 'user_actions_permissions_workflow.json' },
  @{ path = 'user/actions/permissions/repositories'; file = 'user_actions_permissions_repositories.json' }
)

foreach ($c in $calls) {
  Save-Api $c.path $c.file
}

# Basic parsing / heuristics
$summary = [ordered]@{
  timestamp = (Get-Date).ToString('o')
  checks = [ordered]@{}
  raw = @{}
}

function Load-JsonIfExists($file) {
  $p = "$outdir/$file"
  if (Test-Path $p) {
    try { return Get-Content $p -Raw | ConvertFrom-Json } catch { return Get-Content $p -Raw }
  }
  return $null
}

# Load files
$user = Load-JsonIfExists 'user.json'
$perm = Load-JsonIfExists 'user_actions_permissions.json'
runners = Load-JsonIfExists 'user_actions_runners.json'
billing = Load-JsonIfExists 'user_billing_actions.json'
$perm_workflow = Load-JsonIfExists 'user_actions_permissions_workflow.json'
$perm_repos = Load-JsonIfExists 'user_actions_permissions_repositories.json'

$summary.raw.user = $user
$summary.raw.user_actions_permissions = $perm
$summary.raw.user_actions_runners = $runners
$summary.raw.user_billing_actions = $billing
$summary.raw.user_actions_permissions_workflow = $perm_workflow
$summary.raw.user_actions_permissions_repositories = $perm_repos

# Check: Actions disabled at account
$actions_disabled = $false
if ($perm -is [string]) {
  if ($perm -match 'Not Found' -or $perm -match 'message') { $summary.checks.actions_permissions_api = 'error' }
} else {
  if ($perm.enabled -eq $false) { $actions_disabled = $true }
  $summary.checks.actions_permissions_api = $perm
}
$summary.checks.actions_disabled = $actions_disabled

# Check allowed_actions
$allowed_actions = $null
if ($perm -isnot [string] -and $perm.allowed_actions) { $allowed_actions = $perm.allowed_actions }
$summary.checks.allowed_actions = $allowed_actions

# Check default workflow permissions (read/write)
$def_workflow = $null
if ($perm_workflow -isnot [string] -and $perm_workflow.default_workflow_permissions) { $def_workflow = $perm_workflow.default_workflow_permissions }
$summary.checks.default_workflow_permissions = $def_workflow

# Check repos selection policy
$repos_policy = $null
if ($perm_repos -is [string]) { $repos_policy = 'error_or_not_accessible' } else { $repos_policy = $perm_repos }
$summary.checks.repos_policy = $repos_policy

# Check runners count
$runners_count = $null
if ($runners -isnot [string]) {
  if ($runners.total_count -ne $null) { $runners_count = $runners.total_count }
}
$summary.checks.runners_count = $runners_count

# Billing quick check
$billing_issue = $null
if ($billing -is [string]) {
  $billing_issue = 'not_accessible_or_404'
} else {
  $summary.checks.billing_raw = $billing
}
$summary.checks.billing_access = $billing_issue

# Heuristic cause candidates (max 3)
$candidates = @()
if ($actions_disabled) { $candidates += 'Account-level GitHub Actions disabled' }
if ($allowed_actions -and $allowed_actions -eq 'none') { $candidates += 'Allowed actions set to none at account level' }
if ($def_workflow -and $def_workflow -eq 'read') { $candidates += 'Default workflow permissions are read-only' }
if (($perm_repos -is [string]) -or ($perm_repos -eq $null)) { $candidates += 'Organization repository allowlist may block this repository (org API inaccessible)' }
if ($candidates.Count -eq 0) { $candidates += 'Organization-level workflow approval or repository allowlist blocking jobs (investigate org settings)' }
$summary.candidates = $candidates[0..([Math]::Min(2,$candidates.Count-1))]

$summary | ConvertTo-Json -Depth 10 | Out-File "$outdir/summary.json" -Encoding utf8
Write-Output "Account checks written to $outdir"
exit 0

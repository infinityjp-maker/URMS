param(
    [string]$Repo = $(if ($env:GITHUB_REPOSITORY) { $env:GITHUB_REPOSITORY } else { 'infinityjp-maker/URMS' }),
    [int]$Pr,
    [string]$RunId
)

if (-not $Pr) {
    Write-Error "Missing required parameter -Pr (issue/pr number)"
    exit 2
}

function Safe-GetContentRaw($path) {
    try { if (Test-Path $path) { return Get-Content $path -Raw -ErrorAction Stop } }
    catch { return '' }
    return ''
}

if ($RunId) {
    $workdir = "gh-run-$RunId"
    if (-not (Test-Path $workdir)) {
        Write-Output "Downloading run artifacts for run $RunId into $workdir"
        gh run download $RunId --repo $Repo --dir $workdir --error-if-no-artifact-found 2>$null | Out-Null
    }
} else {
    Write-Output "No RunId provided — will attempt to read files from current directory"
    $workdir = '.'
}

$audit = Safe-GetContentRaw (Join-Path $workdir 'audit-output.txt')
$test  = Safe-GetContentRaw (Join-Path $workdir 'test-run-output.txt')

# Status
$status = 'PASS'
if ($test -and $test -match 'TEST-FAILED:') { $status = 'FAIL' }

# Badges
$testBadge = if ($status -eq 'PASS') { '![PASS](https://img.shields.io/badge/Tests-PASS-brightgreen)' } else { '![FAIL](https://img.shields.io/badge/Tests-FAIL-red)' }
$auditBadge = if ($audit -and ($audit -match 'No audit violations found')) { '![PASS](https://img.shields.io/badge/Audit-PASS-brightgreen)' } else { '![FAIL](https://img.shields.io/badge/Audit-FAIL-red)' }

# Build tests table robustly
$testsTableHead = "| Test | Result |`n|---|---|`n"
$rows = @()
if ($test) {
    $matches = Select-String -InputObject $test -Pattern '=== Running\s+(?<name>.+?)\s+===' -AllMatches -ErrorAction SilentlyContinue
    if ($matches) {
        foreach ($m in $matches.Matches) {
            $tname = $m.Groups['name'].Value.Trim()
            $res = 'PASS'
            if ($test -and ($test -match "TEST-FAILED:$([regex]::Escape($tname))")) { $res = 'FAIL' }
            $rows += "| $tname | $res |"
        }
    }
}
if (-not $rows) { $testsTable = "| Test | Result |`n|---|---|`n|(<no tests run>)| - |" } else { $testsTable = $testsTableHead + ($rows -join "`n") }

# Snippet
$snippet = '(<no test output>)'
if ($test) { $lines = $test -split "`r?`n"; $snippet = ($lines[0..([math]::Min(19,$lines.Count-1))] -join "`n") }

$artifactLink = if ($RunId) { "https://github.com/$Repo/actions/runs/$RunId/artifacts" } else { '(no run id)' }

$body = @"
## CI Audit & PowerShell Test Final Summary

$auditBadge

**Audit**
- $([string]::IsNullOrWhiteSpace($audit) ? '(<no audit output>)' : ($audit -replace '[\r\n]+',' '))

$testBadge

**Tests**
- Status: $status

**Artifact**
- $artifactLink

**Results**

$testsTable

<details><summary>test-run-output.txt (first 20 lines)</summary>

```
$snippet
```

</details>
"@

# write to temp file then PATCH via gh api
$tmp = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tmp -Value $body -Encoding UTF8

try {
    $ids = gh api "repos/$Repo/issues/$Pr/comments" --jq '.[] | select(.body | contains("CI Audit")) | .id' 2>$null
    $first = ($ids | Out-String).Trim() -split "\r?\n" | Where-Object {$_} | Select-Object -First 1
    if (-not $first) { Write-Warning "No existing CI Audit comment found; creating a new comment"; gh api "repos/$Repo/issues/$Pr/comments" -f body=@$tmp; exit 0 }
    gh api "repos/$Repo/issues/comments/$first" -X PATCH -F "body=@$tmp"
    Write-Output "Patched comment id $first"
} catch {
    Write-Warning "Failed to update comment: $($_.Exception.Message)"
    Write-Output "Attempting to create a new comment instead"
    try { gh api "repos/$Repo/issues/$Pr/comments" -f body=@$tmp } catch { Write-Error "Also failed to create comment: $($_.Exception.Message)" }
} finally {
    Remove-Item $tmp -ErrorAction SilentlyContinue
}

exit 0

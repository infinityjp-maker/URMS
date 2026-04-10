$outdir = '.gh-run-scripts/selfhosted_test'
New-Item -ItemType Directory -Force -Path $outdir | Out-Null
$runnerDir = '.github-runner'
# repo root path
$repoRoot = (Get-Location).Path

# 1. Check files
$files = @()
foreach ($f in @('config.cmd','run.cmd','svc.cmd')) {
  $p = Join-Path $runnerDir $f
  $files += [PSCustomObject]@{ file = $f; path = $p; exists = Test-Path $p }
}
$files | ConvertTo-Json -Depth 3 | Out-File -FilePath (Join-Path $outdir 'runner_files.json') -Encoding utf8

# 2. Start run.cmd in background and capture output
Push-Location $runnerDir
# set log path under repo root (repoRoot captured before)
$logPath = Join-Path $repoRoot (Join-Path $outdir 'run_cmd_output.txt')
Write-Output "Starting run.cmd; logging to $logPath"
$argArray = @('/c', "run.cmd > `"$logPath`" 2>&1")
$p = Start-Process -FilePath 'cmd.exe' -ArgumentList $argArray -WindowStyle Hidden -PassThru
$p.Id | Out-File -FilePath (Join-Path '..' (Join-Path $outdir 'run_cmd_pid.txt')) -Encoding utf8
Pop-Location

# 3. Wait and inspect output
Start-Sleep -Seconds 30
$txt = ''
try { $txt = Get-Content (Join-Path $outdir 'run_cmd_output.txt') -Raw -ErrorAction Stop } catch { $txt = '' }
$listening = $false
if ($txt -match 'Listening for Jobs') { $listening = $true }

$summaryObj = [ordered]@{
  timestamp = (Get-Date).ToString('o')
  runner_files = (Get-Content (Join-Path $outdir 'runner_files.json') -Raw | ConvertFrom-Json)
  pid = (Get-Content (Join-Path $outdir 'run_cmd_pid.txt') -Raw)
  listening = $listening
}

# 4. If listening, push test commit and poll runs/jobs
if ($listening) {
  Write-Output 'Runner is listening — performing test push and polling for run/jobs'
  $branch = 'validate/final-trigger-test'
  git fetch origin --prune
  try { git rev-parse --verify $branch | Out-Null; git checkout $branch } catch { git checkout -b $branch origin/main }
  $msg = "self-hosted runner live test $(Get-Date -Format o)"
  git commit --allow-empty -m "$msg" | Out-File -FilePath (Join-Path $outdir 'push_commit.txt') -Encoding utf8
  git push origin $branch 2>&1 | Out-File -FilePath (Join-Path $outdir 'push_output.txt') -Encoding utf8

  Start-Sleep -Seconds 6
  $found = $false
  $sha = (git rev-parse HEAD).Trim()
  for ($i=0; $i -lt 12 -and -not $found; $i++) {
    gh api repos/infinityjp-maker/URMS/actions/workflows/selfheal-validate.yml/runs?per_page=5 2> (Join-Path $outdir "poll_$i.err") | Out-File -FilePath (Join-Path $outdir "poll_$i.json") -Encoding utf8
    try { $j = Get-Content (Join-Path $outdir "poll_$i.json") -Raw | ConvertFrom-Json } catch { Start-Sleep -Seconds 6; continue }
    foreach ($r in $j.workflow_runs) {
      if ($r.head_sha -eq $sha -or $r.head_branch -eq $branch) {
        $runId = $r.id
        $r | ConvertTo-Json -Depth 6 | Out-File -FilePath (Join-Path $outdir 'run.json') -Encoding utf8
        gh api repos/infinityjp-maker/URMS/actions/runs/$runId 2> (Join-Path $outdir 'run_detail.err') | Out-File -FilePath (Join-Path $outdir 'run_detail.json') -Encoding utf8
        gh api repos/infinityjp-maker/URMS/actions/runs/$runId/jobs 2> (Join-Path $outdir 'jobs.err') | Out-File -FilePath (Join-Path $outdir 'jobs.json') -Encoding utf8
        $found = $true
        break
      }
    }
    if (-not $found) { Start-Sleep -Seconds 8 }
  }
  $summaryObj.tested_branch = $branch
  $summaryObj.run_found = $found
} else {
  # capture tail
  $tail=''
  try { $tail = Get-Content (Join-Path $outdir 'run_cmd_output.txt') -Tail 200 -Raw } catch { $tail = '' }
  $summaryObj.tail = $tail
}

$summaryObj | ConvertTo-Json -Depth 8 | Out-File -FilePath (Join-Path $outdir 'summary.json') -Encoding utf8
Write-Output "Done; outputs in $outdir"
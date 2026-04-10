# Automated self-hosted runner setup for URMS (Windows)
# Creates .github-runner, downloads latest Windows x64 runner, registers it, installs service, starts it,
# then pushes an empty commit to validate/final-trigger-test and records run/jobs.

$outdir = '.gh-run-scripts/selfhosted_test'
New-Item -ItemType Directory -Force -Path $outdir | Out-Null

function Save-Api([string]$path, [string]$outFile) {
  Write-Output "gh api $path -> $outFile"
  gh api $path 2> "$outdir/$outFile.err" | Out-File -FilePath "$outdir/$outFile" -Encoding utf8
}

# 1. Get registration token
Write-Output 'Requesting registration token...'
$reg = gh api repos/infinityjp-maker/URMS/actions/runners/registration-token 2> "$outdir/registration_token.err" | Out-String
$reg | Out-File "$outdir/registration_token.raw.txt" -Encoding utf8
try {
  $regj = $reg | ConvertFrom-Json
  $token = $regj.token
} catch {
  Write-Output 'Failed to parse registration token JSON. See registration_token.raw.txt and .err file.'
  exit 1
}

# 2. Create runner dir and download latest Windows x64 runner
$runnerDir = '.github-runner'
if (-not (Test-Path $runnerDir)) { New-Item -ItemType Directory -Path $runnerDir | Out-Null }
Push-Location $runnerDir

Write-Output 'Fetching latest runner release metadata...'
$rel = gh api repos/actions/runner/releases/latest 2> "../$outdir/runner_release.err" | Out-String
$rel | Out-File "../$outdir/runner_release.raw.txt" -Encoding utf8
try { $relj = $rel | ConvertFrom-Json } catch { Write-Output 'Failed to parse releases JSON'; Pop-Location; exit 1 }

# find Windows x64 ZIP asset
$asset = $null
foreach ($a in $relj.assets) {
  if ($a.name -like 'actions-runner-win-x64*.zip') { $asset = $a; break }
}
if (-not $asset) {
  Write-Output 'Could not find Windows x64 runner asset in release assets.'
  Pop-Location; exit 1
}
$dl = $asset.browser_download_url
$outZip = $asset.name
Write-Output "Downloading $outZip ..."
Invoke-WebRequest -Uri $dl -OutFile $outZip

# 2b. Extract
Write-Output "Extracting $outZip ..."
Expand-Archive -Path $outZip -DestinationPath '.' -Force

# 3. Configure runner (unattended)
$repoUrl = 'https://github.com/infinityjp-maker/URMS'
$runnerName = 'URMS-WIN'
$work = '_work'
$cfg = Join-Path (Get-Location) 'config.cmd'
if (-not (Test-Path $cfg)) { Write-Output 'config.cmd not found'; Pop-Location; exit 1 }

Write-Output 'Registering runner (this requires network and likely admin rights)...'
$cmd = "./config.cmd --url $repoUrl --token $token --name $runnerName --work $work --unattended --replace"
Write-Output $cmd
& cmd /c $cmd 2>&1 | Tee-Object -FilePath "../$outdir/config_output.txt"

# 4. Install service and start
Write-Output 'Installing service...'
& cmd /c "./svc install" 2>&1 | Tee-Object -FilePath "../$outdir/svc_install.txt"
Write-Output 'Starting service...'
& cmd /c "./svc start" 2>&1 | Tee-Object -FilePath "../$outdir/svc_start.txt"

Pop-Location

# 5. Push empty commit to test branch
$branch = 'validate/final-trigger-test'
Write-Output "Preparing branch $branch for test push"
git fetch origin --prune
try { git rev-parse --verify $branch | Out-Null; git checkout $branch } catch { git checkout -b $branch origin/main }
$msg = "self-hosted runner test $(Get-Date -Format o)"
git commit --allow-empty -m "$msg" | Out-File -FilePath "$outdir/push_commit.txt" -Encoding utf8
git push origin $branch 2>&1 | Out-File -FilePath "$outdir/push_output.txt" -Encoding utf8

# 6/7. Poll latest run and jobs
Start-Sleep -Seconds 6
$found = $false
$sha = (git rev-parse HEAD).Trim()
for ($i=0; $i -lt 12 -and -not $found; $i++) {
  Write-Output "Poll attempt $($i+1)"
  gh api repos/infinityjp-maker/URMS/actions/workflows/selfheal-validate.yml/runs?per_page=5 2> "$outdir/poll_$i.err" | Out-File "$outdir/poll_$i.json" -Encoding utf8
  try { $j = Get-Content "$outdir/poll_$i.json" -Raw | ConvertFrom-Json } catch { Start-Sleep -Seconds 6; continue }
  foreach ($r in $j.workflow_runs) {
    if ($r.head_sha -eq $sha -or $r.head_branch -eq $branch) {
      $runId = $r.id
      $r | ConvertTo-Json -Depth 6 | Out-File "$outdir/run.json" -Encoding utf8
      gh api repos/infinityjp-maker/URMS/actions/runs/$runId 2> "$outdir/run_detail.err" | Out-File -FilePath "$outdir/run_detail.json" -Encoding utf8
      gh api repos/infinityjp-maker/URMS/actions/runs/$runId/jobs 2> "$outdir/jobs.err" | Out-File -FilePath "$outdir/jobs.json" -Encoding utf8
      $found = $true; break
    }
  }
  if (-not $found) { Start-Sleep -Seconds 8 }
}

$summary = [ordered]@{
  timestamp = (Get-Date).ToString('o')
  branch = $branch
  sha = $sha
  found_run = $found
}
$summary | ConvertTo-Json -Depth 6 | Out-File "$outdir/summary.json" -Encoding utf8

Write-Output "Self-hosted runner test complete. Outputs: $outdir"
exit 0

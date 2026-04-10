# Repair and (re)install self-hosted runner on Windows for URMS
$outdir = '.gh-run-scripts/selfhosted_test'
New-Item -ItemType Directory -Force -Path $outdir | Out-Null

$runnerDir = '.github-runner'
Write-Output "Checking runner directory: $runnerDir"
if (Test-Path $runnerDir) {
  $hasConfig = Test-Path (Join-Path $runnerDir 'config.cmd')
  $hasRun = Test-Path (Join-Path $runnerDir 'run.cmd')
  $hasSvc = Test-Path (Join-Path $runnerDir 'svc') -or Test-Path (Join-Path $runnerDir 'svc.cmd')
  Write-Output "Found: config=$hasConfig, run=$hasRun, svc=$hasSvc"
  if (-not ($hasConfig -and $hasRun)) {
    Write-Output "Runner dir incomplete. Removing $runnerDir for clean install."
    try { Remove-Item -Recurse -Force $runnerDir } catch { Write-Output "Remove failed: $_"; exit 1 }
  } else {
    Write-Output "Existing runner appears complete. Will reuse."
  }
}

if (-not (Test-Path $runnerDir)) {
  Write-Output "Creating runner directory"
  New-Item -ItemType Directory -Path $runnerDir | Out-Null
}

Push-Location $runnerDir

# Get registration token (use POST to create token)
Write-Output 'Requesting registration token...'
$regRaw = gh api --method POST repos/infinityjp-maker/URMS/actions/runners/registration-token 2> "../$outdir/registration_token.err" | Out-String
$regRaw | Out-File "../$outdir/registration_token.raw.txt" -Encoding utf8
try { $regj = $regRaw | ConvertFrom-Json; $token = $regj.token } catch { Write-Output 'Failed to obtain token; check registration_token.raw.txt'; Pop-Location; exit 1 }

# Download latest Windows x64 runner
Write-Output 'Fetching latest runner release metadata...'
$relRaw = gh api repos/actions/runner/releases/latest 2> "../$outdir/runner_release.err" | Out-String
$relRaw | Out-File "../$outdir/runner_release.raw.txt" -Encoding utf8
try { $relj = $relRaw | ConvertFrom-Json } catch { Write-Output 'Failed to parse release JSON'; Pop-Location; exit 1 }

$asset = $null
foreach ($a in $relj.assets) {
  if ($a.name -like 'actions-runner-win-x64*.zip' -or ($a.name -match 'win.*x64.*\\.zip')) { $asset = $a; break }
}
if (-not $asset) { Write-Output 'Could not find Windows x64 runner asset'; Pop-Location; exit 1 }

$dl = $asset.browser_download_url
$outZip = $asset.name
Write-Output "Downloading $outZip"
Invoke-WebRequest -Uri $dl -OutFile $outZip

Write-Output "Extracting $outZip"
Expand-Archive -Path $outZip -DestinationPath '.' -Force

# Ensure config.cmd exists
if (-not (Test-Path 'config.cmd')) { Write-Output 'config.cmd missing after extract'; Pop-Location; exit 1 }

# Register runner
$repoUrl = 'https://github.com/infinityjp-maker/URMS'
$runnerName = 'URMS-WIN'
$work = '_work'
Write-Output 'Registering runner (unattended)'
$configCmd = "config.cmd --url $repoUrl --token $token --name $runnerName --work $work --unattended --replace"
Write-Output $configCmd
cmd /c $configCmd 2>&1 | Tee-Object -FilePath "../$outdir/config_output.txt"

# Install and start service
Write-Output 'Installing service'
cmd /c ".\svc.cmd install" 2>&1 | Tee-Object -FilePath "../$outdir/svc_install.txt"
Write-Output 'Starting service'
cmd /c ".\svc.cmd start" 2>&1 | Tee-Object -FilePath "../$outdir/svc_start.txt"

Pop-Location

# Push test empty commit to branch
$branch = 'validate/final-trigger-test'
Write-Output "Preparing branch $branch for test push"
git fetch origin --prune
try { git rev-parse --verify $branch | Out-Null; git checkout $branch } catch { git checkout -b $branch origin/main }
$msg = "self-hosted runner test (retry) $(Get-Date -Format o)"
git commit --allow-empty -m "$msg" | Out-File -FilePath "$outdir/push_commit.txt" -Encoding utf8
git push origin $branch 2>&1 | Out-File -FilePath "$outdir/push_output.txt" -Encoding utf8

# Poll for run/jobs
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

Write-Output "Repair self-hosted runner script complete. Outputs: $outdir"
exit 0

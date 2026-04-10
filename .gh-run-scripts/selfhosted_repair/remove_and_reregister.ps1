# remove_and_reregister.ps1
# 1) obtain remove token and run config.cmd remove
# 2) obtain registration token and run config.cmd to re-register
# 3) prompt admin to run RunnerService.exe install/start, then verify via push/run/jobs

$repo = 'D:\GitHub\URMS'
$workdir = Join-Path $repo '.gh-run-scripts\selfhosted_repair'
New-Item -ItemType Directory -Path $workdir -Force | Out-Null
Set-Location $repo

$remove_file = Join-Path $workdir 'remove_token.json'
$remove_out = Join-Path $workdir 'config_remove_output.txt'
$token_file = Join-Path $workdir 'token.json'
$config_out = Join-Path $workdir 'config_output_after_reregister.txt'
$svc_after = Join-Path $workdir 'service_status_after.txt'
$run = Join-Path $workdir 'run.json'
$jobs = Join-Path $workdir 'jobs.json'
$summary = Join-Path $workdir 'summary.json'
$summary_txt = Join-Path $workdir 'summary.txt'

Write-Output "STEP: obtain remove token"
try {
    gh api --method POST repos/infinityjp-maker/URMS/actions/runners/remove-token | Out-File -FilePath $remove_file -Encoding utf8
    Write-Output "WROTE: $remove_file"
} catch {
    Write-Output "ERROR obtaining remove token: $_"
}

# extract and run config.cmd remove
$remove_token = $null
try {
    $remove_token = (Get-Content -Raw $remove_file | ConvertFrom-Json).token
} catch {}

if ($remove_token) {
    Write-Output "STEP: running config.cmd remove --token <redacted>"
    try {
        Set-Location (Join-Path $repo '.github-runner')
        & .\config.cmd remove --token $remove_token *> $remove_out 2>&1
        Write-Output "WROTE: $remove_out"
    } catch {
        "ERROR during config remove: $_" | Out-File -FilePath $remove_out -Encoding utf8
    }
} else {
    Write-Output "No remove token found; skipping config remove"
}

# obtain registration token and re-register
Write-Output "STEP: obtain registration token"
try {
    gh api --method POST repos/infinityjp-maker/URMS/actions/runners/registration-token | Out-File -FilePath $token_file -Encoding utf8
    Write-Output "WROTE: $token_file"
} catch {
    Write-Output "ERROR obtaining registration token: $_"
}

$reg_token = $null
try { $reg_token = (Get-Content -Raw $token_file | ConvertFrom-Json).token } catch {}
if ($reg_token) {
    Write-Output "STEP: running config.cmd --unattended --token <redacted>"
    try {
        Set-Location (Join-Path $repo '.github-runner')
        & .\config.cmd --url https://github.com/infinityjp-maker/URMS --token $reg_token --unattended *> $config_out 2>&1
        Write-Output "WROTE: $config_out"
    } catch {
        "ERROR during config register: $_" | Out-File -FilePath $config_out -Encoding utf8
    }
} else {
    Write-Output "No registration token found; cannot re-register"
}

# Prompt admin to run RunnerService.exe install/start
Write-Output "Please run as Administrator in a separate PowerShell:"
Write-Output "  cd D:\\GitHub\\URMS\\.github-runner\\bin"
Write-Output "  .\\RunnerService.exe install"
Write-Output "  .\\RunnerService.exe start"

Read-Host "After you finished install/start, press Enter to continue (or Ctrl+C to abort)"

# capture service status after
try {
    Get-Service | Where-Object { $_.Name -like '*runner*' -or $_.DisplayName -like '*runner*' } | Select-Object Name,DisplayName,Status,ServiceType | ConvertTo-Json -Depth 4 | Out-File -FilePath $svc_after -Encoding utf8
    Write-Output "WROTE: $svc_after"
} catch {
    "ERROR_GetService: $_" | Out-File -FilePath $svc_after -Encoding utf8
}

# push empty commit and fetch run/jobs
try {
    Set-Location $repo
    git checkout -B validate/final-trigger-test
    git commit --allow-empty -m "runner verification"
    git push -u origin validate/final-trigger-test --force
    Write-Output "PUSHED_BRANCH"
} catch {
    Write-Output "GIT_PUSH_ERROR: $_"
}

Start-Sleep -Seconds 6
try { gh api repos/infinityjp-maker/URMS/actions/workflows/selfheal-validate.yml/runs?per_page=1 | Out-File -FilePath $run -Encoding utf8 } catch { "ERROR fetching runs: $_" | Out-File -FilePath $run -Encoding utf8 }

try {
    $raw = Get-Content -Raw -Path $run -ErrorAction SilentlyContinue
    $obj = $null
    try { $obj = $raw | ConvertFrom-Json } catch { }
    if ($obj -and $obj.total_count -gt 0 -and $obj.workflow_runs -and $obj.workflow_runs.Count -gt 0) {
        $rid = $obj.workflow_runs[0].id
        gh api repos/infinityjp-maker/URMS/actions/runs/$rid/jobs | Out-File -FilePath $jobs -Encoding utf8
    } else {
        "{}" | Out-File -FilePath $jobs -Encoding utf8
    }
} catch { "ERROR fetching jobs: $_" | Out-File -FilePath $jobs -Encoding utf8 }

# analyze and write summary
$svc_text = Get-Content -Raw -Path $svc_after -ErrorAction SilentlyContinue
$run_text = Get-Content -Raw -Path $run -ErrorAction SilentlyContinue
$jobs_text = Get-Content -Raw -Path $jobs -ErrorAction SilentlyContinue

$runner_online = $false
$jobs_count = 0
$needs_approval = $false
try {
    $jobs_obj = $jobs_text | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($jobs_obj) {
        if ($jobs_obj.total_count) { $jobs_count = $jobs_obj.total_count }
        if ($jobs_obj.jobs) {
            foreach ($j in $jobs_obj.jobs) {
                if ($j.runner_name) { $runner_online = $true }
                if ($j.status -eq 'waiting') { $needs_approval = $true }
            }
        }
    }
} catch {}

$summary_obj = [PSCustomObject]@{
    timestamp = (Get-Date).ToString('o')
    remove_token_file = $remove_file
    remove_output = $remove_out
    registration_token_file = $token_file
    config_output = $config_out
    service_status_after = $svc_after
    run_file = $run
    jobs_file = $jobs
    runner_online = $runner_online
    jobs_count = $jobs_count
    needs_approval = $needs_approval
    re_registered = -not [string]::IsNullOrEmpty($reg_token)
}
$summary_obj | ConvertTo-Json -Depth 10 | Out-File -FilePath $summary -Encoding utf8

@(
    "timestamp: $((Get-Date).ToString('o'))",
    "re_registered: $(-not [string]::IsNullOrEmpty($reg_token))",
    "runner_online: $runner_online",
    "jobs_count: $jobs_count",
    "needs_approval: $needs_approval",
    "service_status_after:",
    $svc_text,
    "run.json:",
    $run_text,
    "jobs.json:",
    $jobs_text
) -join "`n`n" | Out-File -FilePath $summary_txt -Encoding utf8

Write-Output "DONE: summary -> $summary"

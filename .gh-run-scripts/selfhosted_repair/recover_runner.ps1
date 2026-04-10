# recover_runner.ps1
# Automates diagnosis and optional recovery of Windows self-hosted runner (RunnerService.exe model).
# Usage: run from repository root. It may prompt the admin to run service install/start.

$repo = 'D:\GitHub\URMS'
$workdir = Join-Path $repo '.gh-run-scripts\selfhosted_repair'
New-Item -ItemType Directory -Path $workdir -Force | Out-Null
Set-Location $repo

# Files
$svc2 = Join-Path $workdir 'service_status_after2.txt'
$diag_latest = Join-Path $workdir 'diag_latest.txt'
$runner_state = Join-Path $workdir 'runner_state.json'
$token2 = Join-Path $workdir 'token2.json'
$remove_output = Join-Path $workdir 'config_remove_output.txt'
$config_output = Join-Path $workdir 'config_output_after_remove.txt'
$run2 = Join-Path $workdir 'run2.json'
$jobs2 = Join-Path $workdir 'jobs2.json'
$summary = Join-Path $workdir 'summary_recovery.json'
$summary_txt = Join-Path $workdir 'summary_recovery.txt'

# 1) RunnerService.exe status + Get-Service
Try {
    Set-Location (Join-Path $repo '.github-runner\bin')
    & .\RunnerService.exe status *>$svc2 2>&1
} Catch {
    "RunnerService.exe status error: $_" | Out-File -FilePath $svc2 -Encoding utf8
}
Try {
    Get-Service | Where-Object { $_.Name -like '*runner*' -or $_.DisplayName -like '*runner*' } | Select-Object Name,DisplayName,Status,ServiceType | ConvertTo-Json -Depth 4 | Out-File -FilePath $svc2 -Append -Encoding utf8
} Catch {
    "Get-Service error: $_" | Out-File -FilePath $svc2 -Append -Encoding utf8
}

# 2) collect latest _diag logs
$diagDir = Join-Path $repo '.github-runner\_diag'
if (Test-Path $diagDir) {
    $latest = Get-ChildItem -Path $diagDir -File | Sort-Object LastWriteTime -Descending | Select-Object -First 2
    if ($latest) {
        "Collected files:`n" + ($latest | ForEach-Object { $_.FullName + "`n" }) | Out-File -FilePath $diag_latest -Encoding utf8
        foreach ($f in $latest) {
            "=== FILE: $($f.Name) ===`n" | Out-File -FilePath $diag_latest -Append -Encoding utf8
            Get-Content -Path $f.FullName -ErrorAction SilentlyContinue | Select-Object -Last 200 | Out-File -FilePath $diag_latest -Append -Encoding utf8
            "`n`n" | Out-File -FilePath $diag_latest -Append -Encoding utf8
        }
    }
} else {
    "_diag not found at $diagDir" | Out-File -FilePath $diag_latest -Encoding utf8
}

# 3) fetch runner state from GitHub
Try {
    gh api repos/infinityjp-maker/URMS/actions/runners | Out-File -FilePath $runner_state -Encoding utf8
} Catch {
    "GH_API_ERROR: $_" | Out-File -FilePath $runner_state -Encoding utf8
}

# 4) analyze runner_state
$need_remove = $false
$runner_online = $false
$runner_missing = $false
$labels_ok = $null
Try {
    $rs = Get-Content -Raw -Path $runner_state -ErrorAction SilentlyContinue | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($rs -and $rs.runners) {
        $counts = @{online=0;offline=0;busy=0}
        foreach ($r in $rs.runners) {
            if ($r.status -eq 'online') { $counts.online++ }
            elseif ($r.status -eq 'offline') { $counts.offline++ }
            if ($r.status -eq 'offline' -or $r.status -eq 'missing') { $need_remove = $true }
            if ($r.status -eq 'online') { $runner_online = $true }
        }
        $labels_ok = ($rs.runners | Select-Object -First 1).labels
    }
} Catch {
    # ignore
}

# 5) If offline/missing -> attempt remove & re-register
$reconfig_performed = $false
if ($need_remove) {
    # run config.cmd remove
    Try {
        Set-Location (Join-Path $repo '.github-runner')
        & .\config.cmd remove --unattended *> $remove_output 2>&1
    } Catch {
        "config remove error: $_" | Out-File -FilePath $remove_output -Encoding utf8
    }
    # obtain new token
    Try {
        gh api --method POST repos/infinityjp-maker/URMS/actions/runners/registration-token | Out-File -FilePath $token2 -Encoding utf8
        $tok = (Get-Content -Raw -Path $token2 | ConvertFrom-Json).token
        if ($tok) {
            & .\config.cmd --url https://github.com/infinityjp-maker/URMS --token $tok --unattended *> $config_output 2>&1
            $reconfig_performed = $true
        }
    } Catch {
        "token/config error: $_" | Out-File -FilePath $config_output -Encoding utf8
    }
}

# 6) instruct admin to (re)install/start service and poll for runner online
$max_wait = 600 # seconds
$interval = 10
$elapsed = 0
$found_online = $false
Write-Output "IF YOU PERFORMED SERVICE INSTALL/START, THIS SCRIPT WILL POLL GH FOR UP TO $max_wait SECONDS FOR AN ONLINE RUNNER."
while ($elapsed -lt $max_wait) {
    Start-Sleep -Seconds $interval
    $elapsed += $interval
    Try {
        gh api repos/infinityjp-maker/URMS/actions/runners | Out-File -FilePath $runner_state -Encoding utf8
        $rs = Get-Content -Raw -Path $runner_state -ErrorAction SilentlyContinue | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($rs -and $rs.runners) {
            foreach ($r in $rs.runners) {
                if ($r.status -eq 'online') { $found_online = $true; break }
            }
        }
    } Catch {
        # ignore
    }
    if ($found_online) { break }
}

# 7) if found online -> push empty commit and fetch run/jobs
$recovery_run_id = $null
if ($found_online) {
    try {
        Set-Location $repo
        git checkout -B validate/final-trigger-test
        git commit --allow-empty -m "runner recovery verification"
        git push -u origin validate/final-trigger-test --force
    } catch {
        "GIT_PUSH_ERROR: $_" | Out-File -FilePath $run2 -Encoding utf8
    }
    Start-Sleep -Seconds 6
    Try {
        gh api repos/infinityjp-maker/URMS/actions/workflows/selfheal-validate.yml/runs?per_page=1 | Out-File -FilePath $run2 -Encoding utf8
        $rj = Get-Content -Raw -Path $run2 | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($rj -and $rj.total_count -gt 0 -and $rj.workflow_runs.Count -gt 0) {
            $recovery_run_id = $rj.workflow_runs[0].id
            gh api repos/infinityjp-maker/URMS/actions/runs/$recovery_run_id/jobs | Out-File -FilePath $jobs2 -Encoding utf8
        } else {
            "{}" | Out-File -FilePath $jobs2 -Encoding utf8
        }
    } Catch {
        "GH_RUN_FETCH_ERROR: $_" | Out-File -FilePath $run2 -Encoding utf8
    }
}

# 10) build summary_recovery.json
$svc_text = Get-Content -Path $svc2 -Raw -ErrorAction SilentlyContinue
$diag_text = Get-Content -Path $diag_latest -Raw -ErrorAction SilentlyContinue
$runner_state_text = Get-Content -Path $runner_state -Raw -ErrorAction SilentlyContinue
$run2_text = Get-Content -Path $run2 -Raw -ErrorAction SilentlyContinue
$jobs2_text = Get-Content -Path $jobs2 -Raw -ErrorAction SilentlyContinue

$jobs_obj = $null
$jobs_count = 0
$needs_approval = $false
try { $jobs_obj = $jobs2_text | ConvertFrom-Json -ErrorAction SilentlyContinue } catch {}
if ($jobs_obj -and $jobs_obj.total_count) { $jobs_count = $jobs_obj.total_count }

$summary_obj = [PSCustomObject]@{
    timestamp = (Get-Date).ToString('o')
    service_status_file = $svc2
    diag_file = $diag_latest
    runner_state_file = $runner_state
    run_file = $run2
    jobs_file = $jobs2
    initial_need_remove = $need_remove
    reconfig_performed = $reconfig_performed
    runner_found_online = $found_online
    run_id = $recovery_run_id
    jobs_count = $jobs_count
    needs_approval = $needs_approval
    notes = if ($found_online) { 'Runner came online and a run was triggered. See jobs_file.' } else { 'Runner did not come online within timeout. Check service and logs.' }
}
$summary_obj | ConvertTo-Json -Depth 10 | Out-File -FilePath $summary -Encoding utf8

@(
    "timestamp: $((Get-Date).ToString('o'))",
    "initial_need_remove: $need_remove",
    "reconfig_performed: $reconfig_performed",
    "runner_found_online: $found_online",
    "run_id: $recovery_run_id",
    "jobs_count: $jobs_count",
    "service_status:",
    $svc_text,
    "diag_latest:",
    $diag_text,
    "runner_state:",
    $runner_state_text,
    "run2:",
    $run2_text,
    "jobs2:",
    $jobs2_text
) -join "`n`n" | Out-File -FilePath $summary_txt -Encoding utf8

Write-Output "RECOVERY_DONE: summary -> $summary"

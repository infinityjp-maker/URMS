# rebuild_and_verify.ps1
# Rebuild .github-runner completely, remove old registration, re-register, then wait for admin to install/start service and verify.
# Run from repository root.

$repo = 'D:\GitHub\URMS'
$workdir = Join-Path $repo '.gh-run-scripts\selfhosted_repair'
New-Item -ItemType Directory -Path $workdir -Force | Out-Null
Set-Location $repo

$zip = Join-Path $workdir 'actions-runner-win-x64-latest.zip'
$remove_file = Join-Path $workdir 'remove_token.json'
$remove_out = Join-Path $workdir 'config_remove_output.txt'
$token_file = Join-Path $workdir 'token.json'
$config_out = Join-Path $workdir 'config_output_after_reregister.txt'
$svc_after = Join-Path $workdir 'service_status_after.txt'
$run = Join-Path $workdir 'run.json'
$jobs = Join-Path $workdir 'jobs.json'
$summary = Join-Path $workdir 'summary_rebuild.json'
$summary_txt = Join-Path $workdir 'summary_rebuild.txt'
$diag_latest = Join-Path $workdir 'diag_latest.txt'

# 1) remove existing runner folder
Write-Output "STEP 1: Removing existing .github-runner (if present)"
Try {
    Remove-Item -LiteralPath (Join-Path $repo '.github-runner') -Recurse -Force -ErrorAction SilentlyContinue
    Write-Output "REMOVED"
} Catch {
    Write-Output "REMOVE_ERROR: $_"
}

# 2) fetch latest release info for actions/runner and pick win-x64 zip
Write-Output "STEP 2: Fetching latest GitHub Actions runner release URL"
$assetUrl = $null
Try {
    $rel = gh api repos/actions/runner/releases/latest 2>$null | Out-String | ConvertFrom-Json
    if ($rel -and $rel.assets) {
        foreach ($a in $rel.assets) {
            if ($a.name -like '*win-x64*.zip') { $assetUrl = $a.browser_download_url; break }
        }
    }
} Catch {
    Write-Output "GH_RELEASE_ERROR: $_"
}

if (-not $assetUrl) {
    Write-Output "No windows x64 asset found in latest release; aborting."
    exit 1
}

Write-Output "Downloading: $assetUrl"
Try {
    Invoke-WebRequest -Uri $assetUrl -OutFile $zip -UseBasicParsing -ErrorAction Stop
    Write-Output "ZIP_DOWNLOADED: $zip"
} Catch {
    Write-Output "DOWNLOAD_ERROR: $_"
    exit 1
}

# 3) extract to .github-runner
Try {
    Expand-Archive -Path $zip -DestinationPath (Join-Path $repo '.github-runner') -Force
    Write-Output "EXTRACTED"
} Catch {
    Write-Output "EXTRACT_ERROR: $_"
    exit 1
}

# 4) Unblock EXE files in bin
Try {
    $binDir = Join-Path $repo '.github-runner\bin'
    if (Test-Path $binDir) {
        Get-ChildItem -Path $binDir -Filter *.exe -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Unblock-File -Path $_.FullName }
        Write-Output "UNBLOCKED_EXES"
    }
} Catch {
    Write-Output "UNBLOCK_ERROR: $_"
}

# 5) collect diag latest
Try {
    $diagDir = Join-Path $repo '.github-runner\_diag'
    if (Test-Path $diagDir) {
        $latest = Get-ChildItem -Path $diagDir -File | Sort-Object LastWriteTime -Descending | Select-Object -First 2
        if ($latest) {
            "Collected files:`n" + ($latest | ForEach-Object { $_.FullName + "`n" }) | Out-File -FilePath $diag_latest -Encoding utf8
            foreach ($f in $latest) {
                "=== FILE: $($f.Name) ===`n" | Out-File -FilePath $diag_latest -Append -Encoding utf8
                Get-Content -Path $f.FullName -ErrorAction SilentlyContinue | Select-Object -Last 300 | Out-File -FilePath $diag_latest -Append -Encoding utf8
                "`n`n" | Out-File -FilePath $diag_latest -Append -Encoding utf8
            }
        }
    }
} Catch {}

# 6) obtain remove token and run config.cmd remove
Write-Output "STEP 3: Obtaining remove token and running config.cmd remove"
Try {
    gh api --method POST repos/infinityjp-maker/URMS/actions/runners/remove-token | Out-File -FilePath $remove_file -Encoding utf8
    $remove_token = (Get-Content -Raw $remove_file | ConvertFrom-Json).token
    if ($remove_token) {
        Set-Location (Join-Path $repo '.github-runner')
        & .\config.cmd remove --token $remove_token *> $remove_out 2>&1
        Write-Output "CONFIG_REMOVE_DONE: $remove_out"
    } else {
        Write-Output "NO_REMOVE_TOKEN"
    }
} Catch {
    Write-Output "REMOVE_STEP_ERROR: $_"
}

# 7) obtain registration token and re-register
Write-Output "STEP 4: Obtaining registration token and re-registering"
Try {
    gh api --method POST repos/infinityjp-maker/URMS/actions/runners/registration-token | Out-File -FilePath $token_file -Encoding utf8
    $reg_token = (Get-Content -Raw $token_file | ConvertFrom-Json).token
    if ($reg_token) {
        Set-Location (Join-Path $repo '.github-runner')
        & .\config.cmd --url https://github.com/infinityjp-maker/URMS --token $reg_token --unattended *> $config_out 2>&1
        Write-Output "CONFIG_REGISTER_DONE: $config_out"
    } else {
        Write-Output "NO_REG_TOKEN"
    }
} Catch {
    Write-Output "REG_STEP_ERROR: $_"
}

# 8) Prompt admin to install/start service
Write-Output "STEP 5: Please run as Administrator in a separate PowerShell:"
Write-Output "  cd D:\\GitHub\\URMS\\.github-runner\\bin"
Write-Output "  .\\RunnerService.exe install"
Write-Output "  .\\RunnerService.exe start"
Read-Host "After you finished install/start, press Enter to continue (or Ctrl+C to abort)"

# 9) capture service status after
Try {
    Get-Service | Where-Object { $_.Name -like '*runner*' -or $_.DisplayName -like '*runner*' } | Select-Object Name,DisplayName,Status,ServiceType | ConvertTo-Json -Depth 4 | Out-File -FilePath $svc_after -Encoding utf8
} Catch {
    "ERROR_GetService: $_" | Out-File -FilePath $svc_after -Encoding utf8
}

# 10) push empty commit and fetch run/jobs
Try {
    Set-Location $repo
    git checkout -B validate/final-trigger-test
    git commit --allow-empty -m "runner rebuild verification"
    git push -u origin validate/final-trigger-test --force
} Catch {
    Write-Output "GIT_PUSH_ERROR"
}
Start-Sleep -Seconds 6
Try { gh api repos/infinityjp-maker/URMS/actions/workflows/selfheal-validate.yml/runs?per_page=1 | Out-File -FilePath $run -Encoding utf8 } Catch { "GH_RUN_ERROR" | Out-File -FilePath $run -Encoding utf8 }

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
} Catch { "GH_JOBS_ERROR" | Out-File -FilePath $jobs -Encoding utf8 }

# 11) analyze and write summary
$svc_text = Get-Content -Raw -Path $svc_after -ErrorAction SilentlyContinue
$diag_text = Get-Content -Raw -Path $diag_latest -ErrorAction SilentlyContinue
$run_text = Get-Content -Raw -Path $run -ErrorAction SilentlyContinue
$jobs_text = Get-Content -Raw -Path $jobs -ErrorAction SilentlyContinue

$runner_online = $false
$jobs_count = 0
$needs_approval = $false
try {
    $jobs_obj = $jobs_text | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($jobs_obj -and $jobs_obj.total_count) { $jobs_count = $jobs_obj.total_count }
    if ($jobs_obj -and $jobs_obj.jobs) {
        foreach ($j in $jobs_obj.jobs) {
            if ($j.runner_name) { $runner_online = $true }
            if ($j.status -eq 'waiting') { $needs_approval = $true }
        }
    }
} catch {}

$summary_obj = [PSCustomObject]@{
    timestamp = (Get-Date).ToString('o')
    diag_file = $diag_latest
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
    notes = if ($runner_online) { 'Runner online.' } else { 'Runner offline or not recognized by GitHub.' }
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
    "diag_latest:",
    $diag_text,
    "run.json:",
    $run_text,
    "jobs.json:",
    $jobs_text
) -join "`n`n" | Out-File -FilePath $summary_txt -Encoding utf8

Write-Output "DONE: summary -> $summary"

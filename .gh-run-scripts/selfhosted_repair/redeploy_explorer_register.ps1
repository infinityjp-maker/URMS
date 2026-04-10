# redeploy_explorer_register.ps1
# Removes .github-runner, downloads latest Windows x64 runner ZIP,
# unblocks the ZIP, prompts user to extract via Explorer, unblocks EXEs,
# verifies RunnerService.exe size (300-500KB), obtains registration token,
# and runs config.cmd --unattended. Logs saved under .gh-run-scripts/selfhosted_repair.

$repo = 'D:\GitHub\URMS'
$workdir = Join-Path $repo '.gh-run-scripts\selfhosted_repair'
New-Item -ItemType Directory -Path $workdir -Force | Out-Null
$zip = Join-Path $workdir 'actions-runner-win-x64-latest.zip'
$asset_file = Join-Path $workdir 'asset_url.txt'
$runner_dir = Join-Path $repo '.github-runner'
$bin_exes_list = Join-Path $workdir 'bin_exes.txt'
$token_file = Join-Path $workdir 'registration_token.json'
$config_out = Join-Path $workdir 'config_output_explorer.txt'
$summary = Join-Path $workdir 'summary_explorer_redeploy.json'
$logs = @()

function Log($s){ $t = "$(Get-Date -Format o) `t $s"; $logs += $t; Write-Output $t }

# 1) remove existing runner folder completely
Log "STEP 1: Removing existing runner folder if present"
Try{
    if (Test-Path $runner_dir) { Remove-Item -LiteralPath $runner_dir -Recurse -Force -ErrorAction Stop; Log 'REMOVED_RUNNER' }
    else { Log 'NO_EXISTING_RUNNER' }
} Catch { Log "REMOVE_ERROR: $_"; exit 1 }

# 2) find latest win-x64 asset URL
Log "STEP 2: Querying latest runner release and locating win-x64 asset"
$assetUrl = $null
Try{
    $relText = gh api repos/actions/runner/releases/latest 2>$null | Out-String
    $rel = $null
    try{ $rel = $relText | ConvertFrom-Json } catch { }
    if ($rel -and $rel.assets) {
        foreach ($a in $rel.assets) {
            if ($a.name -match 'win(-|_)x64' -and $a.name -like '*.zip') { $assetUrl = $a.browser_download_url; break }
        }
    }
    if (-not $assetUrl) { Log 'NO_ASSET_FOUND'; exit 1 }
    $assetUrl | Out-File -FilePath $asset_file -Encoding utf8
    Log "ASSET_URL: $assetUrl"
} Catch { Log "GH_RELEASE_ERROR: $_"; exit 1 }

# 3) download zip
Log "STEP 3: Downloading ZIP to $zip"
Try{ Invoke-WebRequest -Uri $assetUrl -OutFile $zip -UseBasicParsing -ErrorAction Stop; Log 'ZIP_DOWNLOADED' } Catch { Log "DOWNLOAD_ERROR: $_"; exit 1 }

# 4) unblock the ZIP file
Log "STEP 4: Unblocking ZIP"
Try{ Unblock-File -Path $zip -ErrorAction Stop; Log 'ZIP_UNBLOCKED' } Catch { Log "UNBLOCK_ZIP_ERROR: $_"; exit 1 }

# 5) ensure runner_dir is empty before extraction
Log "STEP 5: Ensuring runner_dir is absent/empty"
Try{
    if (Test-Path $runner_dir) {
        $count = (Get-ChildItem -LiteralPath $runner_dir -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count
        Log "runner_dir exists with $count items; removing again"
        Remove-Item -LiteralPath $runner_dir -Recurse -Force -ErrorAction Stop
        Start-Sleep -Milliseconds 300
    }
    Log 'runner_dir cleared'
} Catch { Log "ENSURE_EMPTY_ERROR: $_"; exit 1 }

# 6) prompt user to extract via Explorer (not using Expand-Archive)
Log "STEP 6: Launching Explorer to prompt user to extract the ZIP using Explorer GUI"
Start-Process -FilePath 'explorer.exe' -ArgumentList "/select,`"$zip`""
Write-Output "Please extract the ZIP file using Explorer (right-click -> Extract All...) to: $runner_dir"
Log "Waiting for user to complete extraction in Explorer..."
Read-Host 'After extraction completes, press Enter to continue (or Ctrl+C to abort)'

# 7) verify extraction happened and unblock EXEs in bin
Log "STEP 7: Verifying extraction and unblocking EXEs in bin"
Try{
    if (-not (Test-Path (Join-Path $runner_dir 'bin'))) { Log 'ERROR: bin directory not found after extraction'; exit 1 }
    Get-ChildItem -Path (Join-Path $runner_dir 'bin') -Filter *.exe -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        try{ Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue } catch {}
        "$($_.FullName) `t $($_.Length)" | Out-File -FilePath $bin_exes_list -Append -Encoding utf8
    }
    Log "BIN_EXES_LIST_WRITTEN: $bin_exes_list"
} Catch { Log "UNBLOCK_BIN_ERROR: $_"; exit 1 }

# 8) verify RunnerService.exe size (ensure not 16KB, require 300-500 KB)
$svcPath = Join-Path $runner_dir 'bin\RunnerService.exe'
Log "STEP 8: Checking RunnerService.exe size at $svcPath"
if (-not (Test-Path $svcPath)) { Log 'ERROR: RunnerService.exe not found'; exit 1 }
$fi = Get-Item -LiteralPath $svcPath
$size = $fi.Length
Log "RunnerService.exe size: $size bytes"
$min = 300*1024; $max = 500*1024
if ($size -eq 16384) { Log 'ERROR: RunnerService.exe is 16 KB (corrupt). Aborting.'; exit 2 }
if ($size -lt $min -or $size -gt $max) { Log "ERROR: RunnerService.exe size not in expected 300-500 KB range. Aborting."; exit 3 }
Log 'RunnerService.exe size OK'

# 9) obtain registration token and save
Log "STEP 9: Obtaining registration token"
Try{ gh api --method POST repos/infinityjp-maker/URMS/actions/runners/registration-token | Out-File -FilePath $token_file -Encoding utf8; Log "TOKEN_SAVED: $token_file" } Catch { Log "TOKEN_ERROR: $_"; exit 1 }

# 10) run config.cmd --unattended
Log "STEP 10: Running config.cmd --unattended to register the runner"
Try{
    Set-Location $runner_dir
    $token = (Get-Content -Raw $token_file | ConvertFrom-Json).token
    if (-not $token) { Log 'ERROR: registration token missing'; exit 1 }
    & .\config.cmd --url https://github.com/infinityjp-maker/URMS --token $token --unattended *> (Join-Path $workdir 'config_output_explorer.txt') 2>&1
    Log "CONFIG_OUTPUT_WRITTEN: $(Join-Path $workdir 'config_output_explorer.txt')"
} Catch { Log "CONFIG_ERROR: $_"; exit 1 }

# 11) write summary
$summaryObj = [PSCustomObject]@{
    timestamp = (Get-Date).ToString('o')
    runner_dir = $runner_dir
    zip = $zip
    asset_url = $assetUrl
    bin_exes_list = $bin_exes_list
    runner_service_path = $svcPath
    runner_service_size = $size
    token_file = $token_file
    config_output = (Join-Path $workdir 'config_output_explorer.txt')
    logs = $logs
}
$summaryObj | ConvertTo-Json -Depth 10 | Out-File -FilePath $summary -Encoding utf8
Log "SUMMARY_WRITTEN: $summary"

Write-Output "DONE"

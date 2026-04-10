# redeploy_and_register.ps1
# Remove .github-runner, download latest Windows x64 runner, extract, unblock EXEs, obtain registration token and register runner.
# Run from repository root.

$repo = 'D:\GitHub\URMS'
$workdir = Join-Path $repo '.gh-run-scripts\selfhosted_repair'
New-Item -ItemType Directory -Path $workdir -Force | Out-Null
Set-Location $repo

$zip = Join-Path $workdir 'actions-runner-win-x64-latest.zip'
$runner_dir = Join-Path $repo '.github-runner'
$token_file = Join-Path $workdir 'registration_token.json'
$config_out = Join-Path $workdir 'config_output_redeploy.txt'
$summary_json = Join-Path $workdir 'summary_redeploy.json'
$summary_txt = Join-Path $workdir 'summary_redeploy.txt'

# 1) remove existing runner folder
Try {
    if (Test-Path $runner_dir) {
        Remove-Item -LiteralPath $runner_dir -Recurse -Force -ErrorAction Stop
        Write-Output "REMOVED_RUNNER"
    } else { Write-Output "NO_EXISTING_RUNNER" }
} Catch {
    Write-Output "REMOVE_ERROR: $_"; exit 1
}

# 2) fetch latest release asset for windows x64
$assetUrl = $null
Try {
    $rel = gh api repos/actions/runner/releases/latest 2>$null | Out-String | ConvertFrom-Json
    if ($rel -and $rel.assets) {
        foreach ($a in $rel.assets) {
            if ($a.name -match 'win(-|_)x64' -and $a.name -like '*.zip') { $assetUrl = $a.browser_download_url; break }
        }
    }
} Catch {
    Write-Output "GH_RELEASE_ERROR: $_"; exit 1
}
if (-not $assetUrl) { Write-Output "NO_ASSET_FOUND"; exit 1 }

# 3) download
Try {
    Invoke-WebRequest -Uri $assetUrl -OutFile $zip -UseBasicParsing -ErrorAction Stop
    Write-Output "ZIP_DOWNLOADED: $zip"
} Catch {
    Write-Output "DOWNLOAD_ERROR: $_"; exit 1
}

# 4) extract
Try {
    Expand-Archive -Path $zip -DestinationPath $runner_dir -Force -ErrorAction Stop
    Write-Output "EXTRACTED: $runner_dir"
} Catch {
    Write-Output "EXTRACT_ERROR: $_"; exit 1
}

# 5) unblock exe files in bin
Try {
    $binDir = Join-Path $runner_dir 'bin'
    if (Test-Path $binDir) {
        Get-ChildItem -Path $binDir -Filter *.exe -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Unblock-File -Path $_.FullName }
        Write-Output "UNBLOCKED_EXES"
    } else { Write-Output "NO_BIN_DIR" }
} Catch {
    Write-Output "UNBLOCK_ERROR: $_"
}

# 6) obtain registration token
Try {
    gh api --method POST repos/infinityjp-maker/URMS/actions/runners/registration-token | Out-File -FilePath $token_file -Encoding utf8
    $reg_token = (Get-Content -Raw $token_file | ConvertFrom-Json).token
    if (-not $reg_token) { Write-Output "NO_REG_TOKEN"; exit 1 }
    Write-Output "TOKEN_SAVED: $token_file"
} Catch {
    Write-Output "TOKEN_ERROR: $_"; exit 1
}

# 7) run config.cmd to register
Try {
    Set-Location $runner_dir
    & .\config.cmd --url https://github.com/infinityjp-maker/URMS --token $reg_token --unattended *> $config_out 2>&1
    Write-Output "CONFIG_DONE: $config_out"
} Catch {
    Write-Output "CONFIG_ERROR: $_"; exit 1
}

# 8) summary
$cfg_text = Get-Content -Path $config_out -Raw -ErrorAction SilentlyContinue
$summary = [PSCustomObject]@{
    timestamp = (Get-Date).ToString('o')
    runner_dir = $runner_dir
    zip = $zip
    asset_url = $assetUrl
    token_file = $token_file
    config_output = $config_out
    config_excerpt = if ($cfg_text) { $cfg_text.Substring(0,[Math]::Min($cfg_text.Length,1000)) } else { '' }
}
$summary | ConvertTo-Json -Depth 6 | Out-File -FilePath $summary_json -Encoding utf8
@(
    "timestamp: $((Get-Date).ToString('o'))",
    "runner_dir: $runner_dir",
    "asset_url: $assetUrl",
    "token_file: $token_file",
    "config_output:",
    $cfg_text
) -join "`n`n" | Out-File -FilePath $summary_txt -Encoding utf8

Write-Output "DONE: summary -> $summary_json"

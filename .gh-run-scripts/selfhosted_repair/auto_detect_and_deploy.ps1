# auto_detect_and_deploy.ps1
# Auto-detect extracted actions-runner-win-x64-* folders, validate RunnerService.exe size,
# replace .github-runner with a good copy, obtain registration token and run config.cmd --unattended.
# Logs and outputs are written to .gh-run-scripts/selfhosted_repair.

$ErrorActionPreference = 'Stop'
$repo = 'D:\GitHub\URMS'
$workdir = Join-Path $repo '.gh-run-scripts\selfhosted_repair'
New-Item -ItemType Directory -Path $workdir -Force | Out-Null
$log = Join-Path $workdir 'auto_detect_and_deploy.log'
function Log([string]$m){ $t = "$(Get-Date -Format o) `t $m"; Add-Content -Path $log -Value $t; Write-Output $t }

$summaryJson = Join-Path $workdir 'summary_auto_deploy.json'
$summaryTxt = Join-Path $workdir 'summary_auto_deploy.txt'
$tokenFile = Join-Path $workdir 'registration_token.json'
$configOut = Join-Path $workdir 'config_output_auto.txt'

Log 'START auto_detect_and_deploy'

# 1) find candidate folders (not ZIPs) under repo recursively (no depth limit)
$pattern = 'actions-runner-win-x64*'
Try{
    $candidates = Get-ChildItem -Path $repo -Directory -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like $pattern } |
        Sort-Object LastWriteTime -Descending
} Catch { Log "ERROR enumerating folders recursively: $_"; throw }

# If no extracted candidate found, attempt controlled re-download and extract of the official ZIP
if (-not $candidates -or $candidates.Count -eq 0) {
    Log 'NO_EXTRACTED_FOLDER_FOUND: will attempt to download official ZIP and extract'

    # remove any existing ZIP artifacts under repo and workdir
    Try{
        $zipGlob = Get-ChildItem -Path $repo -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'actions-runner-win-x64.*\.zip$' }
        foreach ($z in $zipGlob) { Log "REMOVING_OLD_ZIP: $($z.FullName)"; Remove-Item -LiteralPath $z.FullName -Force -ErrorAction SilentlyContinue }
        $workZipGlob = Get-ChildItem -Path $workdir -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'actions-runner-win-x64.*\.zip$' }
        foreach ($z in $workZipGlob) { Log "REMOVING_OLD_WORKZIP: $($z.FullName)"; Remove-Item -LiteralPath $z.FullName -Force -ErrorAction SilentlyContinue }
    } Catch { Log "ZIP_CLEANUP_ERROR: $_" }

    $extractDir = Join-Path $repo 'actions-runner-extracted'
    # Use GitHub Releases API to enumerate releases and assets
    $apiUrl = 'https://api.github.com/repos/actions/runner/releases'
    Log "QUERYING_RELEASES_API: $apiUrl"
    Try{
        $releases = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing -Headers @{ 'User-Agent' = 'powershell' } -ErrorAction Stop
    } Catch { Log "RELEASES_API_ERROR: $_"; @{ error='releases_api_error'; message=$_.Exception.Message } | ConvertTo-Json | Out-File -FilePath $summaryJson -Encoding utf8; Exit 7 }

    if (-not $releases -or $releases.Count -eq 0) { Log 'NO_RELEASES_RETURNED'; @{ error='no_releases' } | ConvertTo-Json | Out-File -FilePath $summaryJson -Encoding utf8; Exit 8 }

    # iterate releases in order, try up to 10 releases
    $maxReleases = 10
    $checked = 0
    $success = $false
    foreach ($rel in $releases) {
        if ($checked -ge $maxReleases) { break }
        $checked++
        $tag = $rel.tag_name
        Log "RELEASE_CHECK [$checked]: $tag"
        if (-not $rel.assets -or $rel.assets.Count -eq 0) { Log "NO_ASSETS_IN_RELEASE: $tag"; continue }
        # find matching assets by name
        $candidatesAssets = $rel.assets | Where-Object { $_.name -match '^actions-runner-win-x64.*\.zip$' }
        if (-not $candidatesAssets -or $candidatesAssets.Count -eq 0) { Log "NO_WIN_X64_ZIP_ASSET_IN_RELEASE: $tag"; continue }
        function Get-OfficialSha([object]$release, [string]$assetName, [string]$assetUrl) {
            # Try: 1) find .sha256 asset in the same release
            if ($release.assets) {
                $shaAssets = $release.assets | Where-Object { $_.name -match '\.sha256$|checksums|sha256sums' }
                foreach ($s in $shaAssets) {
                    Try{
                        $txt = (Invoke-RestMethod -Uri $s.browser_download_url -UseBasicParsing -Headers @{ 'User-Agent'='powershell' } -ErrorAction Stop)
                        if ($txt) {
                            $m = Select-String -InputObject $txt -Pattern '([a-fA-F0-9]{64})' -AllMatches
                            if ($m -and $m.Matches.Count -gt 0) {
                                foreach ($mm in $m.Matches) { if ($txt -match ([regex]::Escape($mm.Value))) { return $mm.Value.ToLower() } }
                            }
                        }
                    } Catch { }
                }
            }
            # Try: direct .sha256 URL next to asset
            $tryUrls = @($assetUrl + '.sha256', $assetUrl + '.sha256.txt', $assetUrl + '.sha256sum')
            foreach ($u in $tryUrls) {
                Try{
                    $txt = (Invoke-RestMethod -Uri $u -UseBasicParsing -Headers @{ 'User-Agent'='powershell' } -ErrorAction Stop)
                    if ($txt) { $m = Select-String -InputObject $txt -Pattern '([a-fA-F0-9]{64})' -AllMatches; if ($m -and $m.Matches.Count -gt 0) { return $m.Matches[0].Value.ToLower() } }
                } Catch { }
            }
            # Try: parse release body for a sha that references the asset name
            if ($release.body) {
                $lines = $release.body -split "\r?\n"
                foreach ($l in $lines) {
                    if ($l -match $assetName -or $l -match [regex]::Escape($assetName)) {
                        $m = [regex]::Match($l, '([a-fA-F0-9]{64})')
                        if ($m.Success) { return $m.Value.ToLower() }
                    }
                }
                # fallback: any sha in body
                $m2 = Select-String -InputObject $release.body -Pattern '([a-fA-F0-9]{64})' -AllMatches
                if ($m2 -and $m2.Matches.Count -gt 0) { return $m2.Matches[0].Value.ToLower() }
            }
            return $null
        }

        foreach ($asset in $candidatesAssets) {
            $assetUrl = $asset.browser_download_url
            $assetName = $asset.name
            $downloadPath = Join-Path $workdir $assetName
            Log "TRY_ASSET: $assetName from $tag -> $assetUrl"
            # remove any existing same-named file
            if (Test-Path $downloadPath) { Remove-Item -LiteralPath $downloadPath -Force -ErrorAction SilentlyContinue }
            Try{
                Invoke-WebRequest -Uri $assetUrl -OutFile $downloadPath -UseBasicParsing -Headers @{ 'User-Agent'='powershell' } -ErrorAction Stop
                Unblock-File -Path $downloadPath -ErrorAction SilentlyContinue
                Log "ZIP_DOWNLOADED: $downloadPath"
                # compute local sha256
                $localHash = (Get-FileHash -Path $downloadPath -Algorithm SHA256).Hash.ToLower()
                Log "LOCAL_ZIP_SHA256: $localHash for $assetName"
                # get official sha for this asset/release
                $official = Get-OfficialSha -release $rel -assetName $assetName -assetUrl $assetUrl
                if (-not $official) {
                    Log "NO_OFFICIAL_SHA_AVAILABLE_FOR_ASSET: $assetName in release $tag"
                    # cannot verify official SHA for this asset; treat as suspect and discard
                    Remove-Item -LiteralPath $downloadPath -Force -ErrorAction SilentlyContinue
                    continue
                }
                Log "OFFICIAL_ZIP_SHA256: $official for $assetName"
                if ($localHash -ne $official) {
                    Log "SHA_MISMATCH: local $localHash != official $official for $assetName - discarding (possible network/proxy corruption)"
                    Remove-Item -LiteralPath $downloadPath -Force -ErrorAction SilentlyContinue
                    continue
                }
                # inspect zip without extracting
                Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
                $z = [System.IO.Compression.ZipFile]::OpenRead($downloadPath)
                $entry = $z.Entries | Where-Object { $_.FullName -like '*bin/RunnerService.exe' -or $_.FullName -like '*bin\\RunnerService.exe' } | Select-Object -First 1
                if (-not $entry) { Log "NO_RUNNERSERVICE_IN_ZIP: $assetName"; $z.Dispose(); Remove-Item -LiteralPath $downloadPath -Force -ErrorAction SilentlyContinue; continue }
                $entryLen = $entry.Length
                Log "ZIP_ENTRY_RUNNERSERVICE_SIZE: $entryLen bytes (asset $assetName)"
                $z.Dispose()
                if ($entryLen -eq 16384) {
                    Log "ZIP_ENTRY_16KB: $assetName - discarding"
                    Remove-Item -LiteralPath $downloadPath -Force -ErrorAction SilentlyContinue
                    continue
                }
                if ($entryLen -lt (300*1024) -or $entryLen -gt (500*1024)) {
                    Log "ZIP_ENTRY_SIZE_OUT_OF_RANGE: $entryLen bytes - discarding"
                    Remove-Item -LiteralPath $downloadPath -Force -ErrorAction SilentlyContinue
                    continue
                }
                # good zip found
                Log "GOOD_ZIP_FOUND: $assetName size $entryLen bytes"
                $success = $true
                $goodZipPath = $downloadPath
                $goodAssetName = $assetName
                $goodSize = $entryLen
                break
            } Catch {
                Log "ASSET_DOWNLOAD_OR_INSPECT_ERROR: $($_)"
                if (Test-Path $downloadPath) { Remove-Item -LiteralPath $downloadPath -Force -ErrorAction SilentlyContinue }
                continue
            }
        }
        if ($success) { break }
    }

    if (-not $success) {
        Log "FAILED_TO_FIND_GOOD_ZIP_AFTER_$maxReleases_RELEASES"
        @{ error='no_good_zip'; checked=$checked } | ConvertTo-Json | Out-File -FilePath $summaryJson -Encoding utf8
        Exit 9
    }
}

if (-not $candidates -or $candidates.Count -eq 0) {
    Log "NO_CANDIDATE_FOUND: No folders named $pattern found under $repo"
    @{ error='no_candidate' ; message='No candidate extraction folders found.' } | ConvertTo-Json | Out-File -FilePath $summaryJson -Encoding utf8
    Exit 1
}

Log "CANDIDATES_FOUND: $($candidates | ForEach-Object { $_.FullName } | Out-String)"

# 2) inspect candidates for RunnerService.exe size
$goodCandidate = $null
$goodSize = 0
foreach ($c in $candidates) {
    $svcPath = Join-Path $c.FullName 'bin\RunnerService.exe'
    if (Test-Path $svcPath) {
        $size = (Get-Item -LiteralPath $svcPath).Length
        Log "CAND_CHECK: $($c.FullName) -> RunnerService.exe size: $size"
        if ($size -eq 16384) { Log "CAND_TOO_SMALL_16KB: $($c.FullName)" ; continue }
        if ($size -ge (300*1024) -and $size -le (500*1024)) {
            $goodCandidate = $c.FullName
            $goodSize = $size
            break
        } else {
            Log "CAND_SIZE_OUT_OF_RANGE: $($c.FullName) size $size"
        }
    } else {
        Log "NO_SVC_IN_CAND: $($c.FullName)"
    }
}

if (-not $goodCandidate) {
    Log "NO_GOOD_CANDIDATE: No candidate with RunnerService.exe in 300-500KB found"
    @{ error='no_good_candidate'; candidates = $candidates.FullName } | ConvertTo-Json | Out-File -FilePath $summaryJson -Encoding utf8
    Exit 2
}

Log "SELECTED_CANDIDATE: $goodCandidate (size $goodSize)"

# 3) remove existing .github-runner completely
$runnerDir = Join-Path $repo '.github-runner'
Try{
    if (Test-Path $runnerDir) {
        Log "REMOVING_EXISTING_RUNNER: $runnerDir"
        Remove-Item -LiteralPath $runnerDir -Recurse -Force -ErrorAction Stop
        Start-Sleep -Milliseconds 200
    }
    New-Item -ItemType Directory -Path $runnerDir | Out-Null
    Log "CREATED_RUNNER_DIR: $runnerDir"
} Catch { Log "REMOVE_CREATE_ERROR: $_"; throw }

# 4) copy candidate contents into .github-runner
# Use Robocopy for robust copy
Try{
    $src = $goodCandidate
    $dst = $runnerDir
    Log "COPYING_FROM_TO: $src -> $dst"
    $rc = & robocopy $src $dst /MIR /COPYALL /R:3 /W:2
    $rcCode = $LASTEXITCODE
    Log "ROBOCOPY_EXITCODE: $rcCode"
    if ($rcCode -ge 8) { Log "ROBOCOPY_FAILED with code $rcCode"; throw "Robocopy failed code $rcCode" }
} Catch { Log "COPY_ERROR: $_"; throw }

# 5) verify RunnerService.exe size in new location
$newSvc = Join-Path $runnerDir 'bin\RunnerService.exe'
if (-not (Test-Path $newSvc)) { Log "ERROR: RunnerService.exe missing after copy: $newSvc"; throw 'missing_after_copy' }
$newSize = (Get-Item -LiteralPath $newSvc).Length
Log "NEW_RUNNERSERVICE_SIZE: $newSize"
if ($newSize -eq 16384) { Log 'ERROR: Copied RunnerService.exe is 16 KB (corrupt). Aborting.'; throw 'copied_16kb' }
if ($newSize -lt (300*1024) -or $newSize -gt (500*1024)) { Log "ERROR: Copied RunnerService.exe size $newSize not in 300-500KB range"; throw 'bad_size_after_copy' }

# 6) obtain registration token
Try{
    gh api --method POST repos/infinityjp-maker/URMS/actions/runners/registration-token | Out-File -FilePath $tokenFile -Encoding utf8
    Log "TOKEN_SAVED: $tokenFile"
} Catch { Log "TOKEN_FETCH_ERROR: $_"; throw }

# 7) run config.cmd --unattended to register
Try{
    Set-Location $runnerDir
    $token = (Get-Content -Raw $tokenFile | ConvertFrom-Json).token
    if (-not $token) { Log 'ERROR: token missing'; throw 'token_missing' }
    & .\config.cmd --url https://github.com/infinityjp-maker/URMS --token $token --unattended *> $configOut 2>&1
    Log "CONFIG_DONE: $configOut"
} Catch { Log "CONFIG_ERROR: $_"; throw }

# 8) write summary
$summary = [PSCustomObject]@{
    timestamp = (Get-Date).ToString('o')
    selected_candidate = $goodCandidate
    original_size = $goodSize
    copied_runner_dir = $runnerDir
    new_size = $newSize
    token_file = $tokenFile
    config_output = $configOut
}
$summary | ConvertTo-Json -Depth 10 | Out-File -FilePath $summaryJson -Encoding utf8
$summary | Out-String | Out-File -FilePath $summaryTxt -Encoding utf8
Log 'SUMMARY_WRITTEN'
Log 'END auto_detect_and_deploy'
Write-Output "DONE: summary -> $summaryJson"

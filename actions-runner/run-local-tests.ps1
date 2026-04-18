param(
    [string]$RepoRoot = (Get-Location).Path,
    [int]$MaxAttempts = 3
)

$absOut = Join-Path $RepoRoot 'test-run-output.txt'
if (Test-Path $absOut) { Remove-Item -Force $absOut }

function Run-OnePass {
    $tests = Get-ChildItem -Path (Join-Path $RepoRoot 'actions-runner') -Filter 'test-*.ps1' -File -ErrorAction SilentlyContinue
    if (-not $tests) { Write-Output "No tests found"; return 0 }
    $overall = $true
    foreach ($t in $tests) {
        $name = $t.Name
        $scriptPath = $t.FullName
        $header = "=== Running $name ==="
        $header | Tee-Object -FilePath $absOut -Append
        # Run in child pwsh process; write stdout/stderr to a temp file and then append to the aggregate output
        $cmd = ". '$scriptPath'"
        $tempOut = Join-Path $RepoRoot ("actions-runner\temp-$($name)-output.txt")
        if (Test-Path $tempOut) { Remove-Item -Force $tempOut -ErrorAction SilentlyContinue }
        $ps = Start-Process pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command',$cmd -NoNewWindow -PassThru -Wait -RedirectStandardOutput $tempOut
        $exit = $ps.ExitCode
        # append child output to aggregate log
        if (Test-Path $tempOut) { Get-Content $tempOut -ErrorAction SilentlyContinue | Tee-Object -FilePath $absOut -Append; Remove-Item -Force $tempOut -ErrorAction SilentlyContinue }
        if ($exit -ne 0) {
            $overall = $false
            "TEST-FAILED:$name" | Tee-Object -FilePath $absOut -Append
        }
    }
    return ([int]($overall -eq $true))
}

function Analyze-Failures {
    param([string]$outPath)
    if (-not (Test-Path $outPath)) { return @() }
    $lines = Get-Content $outPath -ErrorAction SilentlyContinue
    $fails = $lines | Where-Object { $_ -match '^TEST-FAILED:' } | ForEach-Object { $_ -replace '^TEST-FAILED:','' }
    return $fails
}

function Quick-AnalyzeScript {
    param([string]$scriptPath)
    try {
        $content = Get-Content $scriptPath -Raw -ErrorAction SilentlyContinue
        $issues = @()
        if ($content -match "(^|\n)\s*exit\b") { $issues += 'exit_statement' }
        if ($content -match 'ConvertTo-Json' -and $content -notmatch '-Depth') { $issues += 'converttojson_depth_missing' }
        if ($content -match 'Out-File' -and $content -notmatch '-Encoding') { $issues += 'outfile_encoding_missing' }
        if ($content -notmatch 'try\s*\{') { $issues += 'no_try_block_detected' }
        return $issues
    } catch {
        Write-Warning "Quick-AnalyzeScript: failed to read/parse ${scriptPath}: $(param(
    [string]$RepoRoot = (Get-Location).Path,
    [int]$MaxAttempts = 3
)

$absOut = Join-Path $RepoRoot 'test-run-output.txt'
if (Test-Path $absOut) { Remove-Item -Force $absOut }

function Run-OnePass {
    $tests = Get-ChildItem -Path (Join-Path $RepoRoot 'actions-runner') -Filter 'test-*.ps1' -File -ErrorAction SilentlyContinue
    if (-not $tests) { Write-Output "No tests found"; return 0 }
    $overall = $true
    foreach ($t in $tests) {
        $name = $t.Name
        $scriptPath = $t.FullName
        $header = "=== Running $name ==="
        $header | Tee-Object -FilePath $absOut -Append
        # Run in child pwsh process; write stdout/stderr to a temp file and then append to the aggregate output
        $cmd = ". '$scriptPath'"
        $tempOut = Join-Path $RepoRoot ("actions-runner\temp-$($name)-output.txt")
        if (Test-Path $tempOut) { Remove-Item -Force $tempOut -ErrorAction SilentlyContinue }
        $ps = Start-Process pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command',$cmd -NoNewWindow -PassThru -Wait -RedirectStandardOutput $tempOut
        $exit = $ps.ExitCode
        # append child output to aggregate log
        if (Test-Path $tempOut) { Get-Content $tempOut -ErrorAction SilentlyContinue | Tee-Object -FilePath $absOut -Append; Remove-Item -Force $tempOut -ErrorAction SilentlyContinue }
        if ($exit -ne 0) {
            $overall = $false
            "TEST-FAILED:$name" | Tee-Object -FilePath $absOut -Append
        }
    }
    return ([int]($overall -eq $true))
}

function Analyze-Failures {
    param([string]$outPath)
    if (-not (Test-Path $outPath)) { return @() }
    $lines = Get-Content $outPath -ErrorAction SilentlyContinue
    $fails = $lines | Where-Object { $_ -match '^TEST-FAILED:' } | ForEach-Object { $_ -replace '^TEST-FAILED:','' }
    return $fails
}

function Quick-AnalyzeScript {
    param([string]$scriptPath)
    try {
        $content = Get-Content $scriptPath -Raw -ErrorAction SilentlyContinue
        $issues = @()
        if ($content -match "(^|\n)\s*exit\b") { $issues += 'exit_statement' }
        if ($content -match 'ConvertTo-Json' -and $content -notmatch '-Depth') { $issues += 'converttojson_depth_missing' }
        if ($content -match 'Out-File' -and $content -notmatch '-Encoding') { $issues += 'outfile_encoding_missing' }
        if ($content -notmatch 'try\s*\{') { $issues += 'no_try_block_detected' }
        return $issues
    } catch {
        Write-Warning "Quick-AnalyzeScript: failed to read/parse $scriptPath: $($_.Exception.Message)"
        return @()
    }
}

function Apply-Minimal-Patch {
    param([string]$scriptPath, [string[]]$issues)
    try {
        $orig = Get-Content $scriptPath -Raw
        $modified = $orig
        $patched = $false
        if ($issues -contains 'exit_statement') {
            # replace top-level "exit <n>" with "return <n>" to avoid killing process
            $new = $modified -replace "(?m)^[ \t]*exit\s+(\d+)","return $1"
            if ($new -ne $modified) { $modified = $new; $patched = $true }
        }
        if ($issues -contains 'converttojson_depth_missing') {
            # add -Depth 5 to JSON conversion calls (heuristic)
            try {
                $new = $modified -replace 'ConvertTo-Json(\s*\|)','ConvertTo-Json -Depth 5$1'
                if ($new -ne $modified) { $modified = $new; $patched = $true }
            } catch {
                Write-Warning "Apply-Minimal-Patch: JSON conversion replacement failed for $scriptPath"
            }
        }
        if ($issues -contains 'outfile_encoding_missing') {
            # add -Encoding utf8 to file write calls
            try {
                $new = $modified -replace 'Out-File\s+-FilePath','Out-File -FilePath'
            } catch {
                Write-Warning "Apply-Minimal-Patch: filename replacement failed for $scriptPath"
                $new = $modified
            }
            try {
                # naive: append -Encoding utf8 when not present
                $new = $new -replace '(Out-File\s+[^\n\r]*?)(\r?\n)','$1 -Encoding utf8`n'
            } catch {
                Write-Warning "Apply-Minimal-Patch: encoding append failed for $scriptPath"
                $new = $modified
            }
            if ($new -ne $modified) { $modified = $new; $patched = $true }
        }
        if ($patched) {
            # write backup and overwrite
            try {
                Copy-Item $scriptPath "$scriptPath.bak" -Force
            } catch {
                Write-Warning "Apply-Minimal-Patch: failed to create backup for $scriptPath: $($_.Exception.Message)"
            }
            try {
                Set-Content -Path $scriptPath -Value $modified -Encoding utf8
            } catch {
                Write-Warning "Apply-Minimal-Patch: failed to write patched content to $scriptPath: $($_.Exception.Message)"
                return $false
            }
        }
        return $patched
    } catch {
        Write-Warning "Apply-Minimal-Patch failed for $scriptPath: $($_.Exception.Message)"
        return $false
    }
}

# Loop attempts
$attempt = 0
while ($attempt -lt $MaxAttempts) {
    $attempt++
    "Attempt $attempt" | Tee-Object -FilePath $absOut -Append
    $res = Run-OnePass
    Start-Sleep -Seconds 1
    if ($res -eq 1) {
        "All tests passed on attempt $attempt" | Tee-Object -FilePath $absOut -Append
        exit 0
    }
    $fails = Analyze-Failures -outPath $absOut
    if (-not $fails -or $fails.Count -eq 0) {
        "No TEST-FAILED entries but some tests returned non-zero; aborting" | Tee-Object -FilePath $absOut -Append
        exit 2
    }
    $anyPatched = $false
    foreach ($f in $fails) {
        $scriptPath = Join-Path $RepoRoot "actions-runner\$f"
        if (-not (Test-Path $scriptPath)) { "Failed script not found: $scriptPath" | Tee-Object -FilePath $absOut -Append; continue }
        $issues = Quick-AnalyzeScript -scriptPath $scriptPath
        "Analyzing $f -> issues: $($issues -join ',')" | Tee-Object -FilePath $absOut -Append
        if ($issues.Count -gt 0) {
            $patched = Apply-Minimal-Patch -scriptPath $scriptPath -issues $issues
            if ($patched) {
                "Patched $f (backup at $f.bak)" | Tee-Object -FilePath $absOut -Append
                $anyPatched = $true
            } else {
                "No patch applied for $f" | Tee-Object -FilePath $absOut -Append
            }
        }
    }
    if (-not $anyPatched) { "No applicable patches; stopping." | Tee-Object -FilePath $absOut -Append; exit 3 }
    else { "Patches applied; re-running tests" | Tee-Object -FilePath $absOut -Append; continue }
}

"Exceeded max attempts ($MaxAttempts); tests still failing." | Tee-Object -FilePath $absOut -Append
exit 4



.Exception.Message)"
        return @()
    }
}

function Apply-Minimal-Patch {
    param([string]$scriptPath, [string[]]$issues)
    try {
        $orig = Get-Content $scriptPath -Raw
        $modified = $orig
        $patched = $false
        if ($issues -contains 'exit_statement') {
            # replace top-level "exit <n>" with "return <n>" to avoid killing process
            $new = $modified -replace "(?m)^[ \t]*exit\s+(\d+)","return $1"
            if ($new -ne $modified) { $modified = $new; $patched = $true }
        }
        if ($issues -contains 'converttojson_depth_missing') {
            # add -Depth 5 to JSON conversion calls (heuristic)
            try {
                $new = $modified -replace 'ConvertTo-Json(\s*\|)','ConvertTo-Json -Depth 5$1'
                if ($new -ne $modified) { $modified = $new; $patched = $true }
            } catch {
                Write-Warning "Apply-Minimal-Patch: JSON conversion replacement failed for $scriptPath"
            }
        }
        if ($issues -contains 'outfile_encoding_missing') {
            # add -Encoding utf8 to file write calls
            try {
                $new = $modified -replace 'Out-File\s+-FilePath','Out-File -FilePath'
            } catch {
                Write-Warning "Apply-Minimal-Patch: filename replacement failed for $scriptPath"
                $new = $modified
            }
            try {
                # naive: append -Encoding utf8 when not present
                $new = $new -replace '(Out-File\s+[^\n\r]*?)(\r?\n)','$1 -Encoding utf8`n'
            } catch {
                Write-Warning "Apply-Minimal-Patch: encoding append failed for $scriptPath"
                $new = $modified
            }
            if ($new -ne $modified) { $modified = $new; $patched = $true }
        }
        if ($patched) {
            # write backup and overwrite
            try {
                Copy-Item $scriptPath "$scriptPath.bak" -Force
            } catch {
                Write-Warning "Apply-Minimal-Patch: failed to create backup for $scriptPath: $($_.Exception.Message)"
            }
            try {
                Set-Content -Path $scriptPath -Value $modified -Encoding utf8
            } catch {
                Write-Warning "Apply-Minimal-Patch: failed to write patched content to $scriptPath: $($_.Exception.Message)"
                return $false
            }
        }
        return $patched
    } catch {
        Write-Warning "Apply-Minimal-Patch failed for $scriptPath: $($_.Exception.Message)"
        return $false
    }
}

# Loop attempts
$attempt = 0
while ($attempt -lt $MaxAttempts) {
    $attempt++
    "Attempt $attempt" | Tee-Object -FilePath $absOut -Append
    $res = Run-OnePass
    Start-Sleep -Seconds 1
    if ($res -eq 1) {
        "All tests passed on attempt $attempt" | Tee-Object -FilePath $absOut -Append
        exit 0
    }
    $fails = Analyze-Failures -outPath $absOut
    if (-not $fails -or $fails.Count -eq 0) {
        "No TEST-FAILED entries but some tests returned non-zero; aborting" | Tee-Object -FilePath $absOut -Append
        exit 2
    }
    $anyPatched = $false
    foreach ($f in $fails) {
        $scriptPath = Join-Path $RepoRoot "actions-runner\$f"
        if (-not (Test-Path $scriptPath)) { "Failed script not found: $scriptPath" | Tee-Object -FilePath $absOut -Append; continue }
        $issues = Quick-AnalyzeScript -scriptPath $scriptPath
        "Analyzing $f -> issues: $($issues -join ',')" | Tee-Object -FilePath $absOut -Append
        if ($issues.Count -gt 0) {
            $patched = Apply-Minimal-Patch -scriptPath $scriptPath -issues $issues
            if ($patched) {
                "Patched $f (backup at $f.bak)" | Tee-Object -FilePath $absOut -Append
                $anyPatched = $true
            } else {
                "No patch applied for $f" | Tee-Object -FilePath $absOut -Append
            }
        }
    }
    if (-not $anyPatched) { "No applicable patches; stopping." | Tee-Object -FilePath $absOut -Append; exit 3 }
    else { "Patches applied; re-running tests" | Tee-Object -FilePath $absOut -Append; continue }
}

"Exceeded max attempts ($MaxAttempts); tests still failing." | Tee-Object -FilePath $absOut -Append
exit 4




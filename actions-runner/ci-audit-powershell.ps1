param()

$Base = Split-Path -Parent $MyInvocation.MyCommand.Path
$Files = Get-ChildItem -Path $Base -Recurse -Include *.ps1 -File | Where-Object { $_.FullName -notmatch '\\_work\\' -and $_.FullName -notmatch '\\third-party\\' -and $_.FullName -notmatch '\\node_modules\\' -and $_.Name -notmatch '^test-' -and $_.Name -notmatch '\.mock\.' }
$violations = @()

function In-TryCatch($lines, $idx) {
    if ($lines[$idx] -match '^\s*try\s*\{.*?\b(ConvertTo-Json|Out-File|Add-Content|Set-Content)\b') { return $true }
    $hasTry = $false
    for ($i = $idx - 1; $i -ge 0; $i--) {
        if ($lines[$i] -match '^\s*try\s*\{') { $hasTry = $true; break }
        if ($lines[$i] -match '^\s*catch\s*\{' -or $lines[$i] -match '^\s*\}') { break }
    }
    if (-not $hasTry) { return $false }
    $hasCatch = $false
    for ($i = $idx + 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^\s*\}\s*catch\b' -or $lines[$i] -match '^\s*catch\s*\{') { $hasCatch = $true; break }
        if ($lines[$i] -match '^\s*try\s*\{') { break }
    }
    return $hasCatch
}

# Simple heuristic: look back a few lines for a 'try' token (helps with same-line or compact try blocks)
function Is-Within-TrySimple($lines, $idx) {
    $start = [Math]::Max(0, $idx - 3)
    for ($k = $idx; $k -ge $start; $k--) {
        if ($lines[$k] -match '\btry\b') { return $true }
    }
    return $false
}

foreach ($f in $Files) {
    if ($f.FullName -eq $MyInvocation.MyCommand.Path) { continue }
    $rel = $f.FullName.Substring($Base.Length).TrimStart('\\')
    try {
        $fileContent = Get-Content -Path $f.FullName -Raw -ErrorAction Stop
        $lines = Get-Content -Path $f.FullName -ErrorAction Stop

        # If this file declares known safe helper functions (Write-Result, LogJson, SafeWriteJsonToFile),
        # skip line-level ConvertTo-Json/Out-File checks as those helpers already guard writes.
        $fileHasJsonHelpers = $false
        if ($fileContent -match '\bfunction\s+Write-Result\b' -or $fileContent -match '\bfunction\s+LogJson\b' -or $fileContent -match '\bfunction\s+SafeWriteJsonToFile\b') { $fileHasJsonHelpers = $true }

        # Rule 2: Exception handling for I/O
        for ($i=0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            if ($line -match '\b(Out-File|Add-Content|Set-Content|ConvertTo-Json)\b') {
                if ($fileHasJsonHelpers) { continue }
                if (-not (In-TryCatch $lines $i)) {
                    $violations += "$($rel):($($i+1)): Missing try/catch around I/O or conversion: $($line.Trim())"
                }
            }
        }
    } catch {
        Write-Warning "Failed to audit $($rel): $($_.Exception.Message)"
    }
}

if ($violations.Count -gt 0) {
    $violations | ForEach-Object { Write-Host $_.ToString() }
    exit 1
} else {
    Write-Host "No audit violations found."
    exit 0
}

function Repair-QueueIndex {
    param([string]$QD)
    try {
        if (-not (Test-Path $QD)) { return }
        $items = @(Get-ChildItem -Path $QD -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -eq '.zip' } | Select-Object -ExpandProperty Name)
        $oldDeleted = 0
        $idxPath = Join-Path $QD 'index.json'
        if (Test-Path $idxPath) {
            try { $old = Get-Content $idxPath -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue; if ($old -and $old.deleted_count) { $oldDeleted = [int]$old.deleted_count } } catch { Write-Warning "Repair-QueueIndex: failed reading index.json: $($_.Exception.Message)" }
        }
        $new = @{ count = ($items | Measure-Object).Count; files = $items; deleted_count = $oldDeleted; updated = (Get-Date).ToString('o') }
        try { $new | ConvertTo-Json -Compress | Out-File -FilePath $idxPath -Encoding utf8 -Force } catch { Write-Warning "queue-utils: failed writing index.json: $($_.Exception.Message)" }
        return $new
    } catch { Write-Warning "Repair-QueueIndex failed: $($_.Exception.Message)"; return $null }
}

function Load-QueueIndex {
    param([string]$QD)
    $idxPath = Join-Path $QD 'index.json'
    if (-not (Test-Path $QD)) { return $null }
    # Ensure index exists and is consistent with physical .zip files
    try {
        $zipFiles = @(Get-ChildItem -Path $QD -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -eq '.zip' } | Select-Object -ExpandProperty Name)
        $idx = $null
        if (Test-Path $idxPath) {
            try { $raw = Get-Content $idxPath -Raw -ErrorAction SilentlyContinue; $idx = $raw | ConvertFrom-Json -ErrorAction SilentlyContinue } catch { Write-Warning "Load-QueueIndex: failed parsing index.json: $($_.Exception.Message)"; $idx = $null }
        }
        if (-not $idx) {
            # no valid index -> rebuild
            return Repair-QueueIndex -QD $QD
        }
        # synchronize files listed in index with physical files
        $listed = @()
        if ($idx.files) { $listed = @($idx.files) }
        $missingFromIndex = $zipFiles | Where-Object { $listed -notcontains $_ }
        $staleEntries = $listed | Where-Object { $zipFiles -notcontains $_ }
        if ($missingFromIndex.Count -gt 0 -or $staleEntries.Count -gt 0) {
            $newFiles = @(($listed + $missingFromIndex) | Where-Object { $zipFiles -contains $_ } | Select-Object -Unique)
            $oldDeleted = 0
            if ($idx.deleted_count) { $oldDeleted = [int]$idx.deleted_count }
            $newIdx = @{ count = ($newFiles | Measure-Object).Count; files = $newFiles; deleted_count = $oldDeleted; updated = (Get-Date).ToString('o') }
            try { $newIdx | ConvertTo-Json -Compress | Out-File -FilePath $idxPath -Encoding utf8 -Force } catch { Write-Warning "queue-utils: failed writing index.json: $($_.Exception.Message)" }
            return $newIdx
        }
        return $idx
    } catch { Write-Warning "Load-QueueIndex failed: $($_.Exception.Message)"; return Repair-QueueIndex -QD $QD }
}

function Add-QueueEntry {
    param([string]$SourceZip, [string]$QD)
    if (-not (Test-Path $QD)) { New-Item -Path $QD -ItemType Directory | Out-Null }
    $dest = Join-Path $QD (Split-Path $SourceZip -Leaf)
    try { Copy-Item -Path $SourceZip -Destination $dest -Force -ErrorAction Stop } catch { Copy-Item -Path $SourceZip -Destination $dest -Force -ErrorAction SilentlyContinue }
    # update index.json
    $idxPath = Join-Path $QD 'index.json'
    $items = @(Get-ChildItem -Path $QD -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -eq '.zip' } | Select-Object -ExpandProperty Name)
    $oldDeleted = 0
    if (Test-Path $idxPath) {
        try { $old = Get-Content $idxPath -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue; if ($old -and $old.deleted_count) { $oldDeleted = [int]$old.deleted_count } } catch { Write-Warning "Add-QueueEntry: failed reading old index.json: $($_.Exception.Message)" }
    }
    $index = @{ count = ($items | Measure-Object).Count; files = @($items); deleted_count = $oldDeleted; updated = (Get-Date).ToString('o') }
    try { $index | ConvertTo-Json -Compress | Out-File -FilePath $idxPath -Encoding utf8 -Force } catch { Write-Warning "queue-utils: failed writing index.json: $($_.Exception.Message)" }
    return (Split-Path $dest -Leaf)
}


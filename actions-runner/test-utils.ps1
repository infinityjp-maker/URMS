function Save-TestResult {
    param(
        [string]$Name,
        [bool]$Pass,
        [hashtable]$Meta
    )
    try {
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
        if (-not (Test-Path (Join-Path $scriptDir 'test-results'))) { New-Item -Path (Join-Path $scriptDir 'test-results') -ItemType Directory | Out-Null }
        $obj = @{ name = $Name; pass = $Pass; meta = $Meta; time = (Get-Date).ToString('o') }
        $trDir = Join-Path $scriptDir 'test-results'
        if (-not (Test-Path $trDir)) { New-Item -Path $trDir -ItemType Directory | Out-Null }
        try {
            ($obj | ConvertTo-Json -Compress -Depth 5) | Out-File -FilePath (Join-Path $trDir ("${Name}.json")) -Encoding utf8 -Force
        } catch {
            Write-Warning "Save-TestResult: primary write failed: $($_.Exception.Message)"
            try {
                ($obj | ConvertTo-Json -Compress -Depth 1) | Out-File -FilePath (Join-Path $trDir ("${Name}.json")) -Encoding utf8 -Force
            } catch {
                Write-Warning "Save-TestResult: fallback write failed: $($_.Exception.Message)"
                return $false
            }
        }
        return $true
    } catch { return $false }
}

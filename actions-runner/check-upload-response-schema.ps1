param(
    [Parameter(Mandatory=$true)][string]$ResponseJson,
    [string]$QueueDir
)

# Resolve script directory robustly for structured log writes
$ScriptDirResolved = $PSScriptRoot
if (-not $ScriptDirResolved) {
    try { $ScriptDirResolved = Split-Path -Parent $MyInvocation.MyCommand.Path } catch { $ScriptDirResolved = $null }
}
if (-not $ScriptDirResolved) { $ScriptDirResolved = (Get-Location).Path }

# Validate that ResponseJson contains required fields: ok (bool), delete (bool)
function Write-Result([bool]$valid, [array]$errors, $parsed) {
    $out = @{ valid = $valid; errors = $errors; parsed = $parsed; time = (Get-Date).ToString('o') }
    try {
        $json = $out | ConvertTo-Json -Compress
        Write-Output $json
        if ($QueueDir -and ($QueueDir -ne '')) {
            if (Test-Path $QueueDir) {
                try { $json | Out-File -FilePath (Join-Path $QueueDir 'last_schema_check.json') -Encoding utf8 -Force } catch { Write-Warning "check-upload-response-schema: failed writing last_schema_check.json: $($_.Exception.Message)" }
            }
        }
    } catch { Write-Output "WARN: failed to serialize/write schema-check outputs: $($_.Exception.Message)" }
        # Also write a structured WARN/ERROR line into runner_auto_start.json.log for operator visibility
        if ($QueueDir -and ($QueueDir -ne '')) {
                if (Test-Path $QueueDir) {
                    try {
                        if ($ScriptDirResolved -and ($ScriptDirResolved -ne '')) {
                            if (Test-Path $ScriptDirResolved) {
                                try {
                                    $jsonLog = Join-Path $ScriptDirResolved 'runner_auto_start.json.log'
                                    $level = if ($valid) { 'INFO' } else { 'WARN' }
                                    $logObj = @{ timestamp = (Get-Date).ToString('o'); level = $level; message = 'schema_check'; valid = $valid; errors = $errors }
                                    try { if ($jsonLog -and ($jsonLog -ne '')) { $logObj | ConvertTo-Json -Compress | Out-File -FilePath $jsonLog -Append -Encoding utf8 -ErrorAction SilentlyContinue } }
                                    catch { Write-Warning "check-upload-response-schema: failed writing runner_auto_start.json.log: $($_.Exception.Message)" }
                                } catch { Write-Warning "check-upload-response-schema: structured log write failed: $($_.Exception.Message)" }
                            }
                        }
                    } catch { Write-Warning "check-upload-response-schema: structured log write failed: $($_.Exception.Message)" }
                }
        }
        if ($valid) { exit 0 } else { exit 1 }
}

try {
    $errors = @()
    $parsed = $null
    try {
        $parsed = $ResponseJson | ConvertFrom-Json -ErrorAction Stop
    } catch {
        $errors += "invalid_json"
        Write-Result $false $errors $null
        exit 1
    }

    # ok must be present and boolean
    if (-not ($parsed.PSObject.Properties.Name -contains 'ok')) { $errors += 'missing_ok' } else { if (-not ($parsed.ok -is [bool])) { $errors += 'ok_not_bool' } }
    # delete must be present and boolean
    if (-not ($parsed.PSObject.Properties.Name -contains 'delete')) { $errors += 'missing_delete' } else { if (-not ($parsed.delete -is [bool])) { $errors += 'delete_not_bool' } }

    if ($errors.Count -gt 0) { Write-Result $false $errors $parsed; exit 1 } else { Write-Result $true @() $parsed; exit 0 }

} catch {
    try {
        Write-Warning "check-upload-response-schema: unexpected error: $($_.Exception.Message)"
        try { Write-Result $false @('internal_error',$_.Exception.Message) $null } catch { Write-Output "check-upload-response-schema: fatal while reporting error: $($_.Exception.Message)" }
    } catch {}
    exit 2
}

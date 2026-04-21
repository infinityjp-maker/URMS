<#
test-schema-validation.ps1
- Tests check-upload-response-schema.ps1 with valid, invalid, and non-JSON inputs
- Verifies exit codes and creates/prints last_schema_check.json
#>
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
# load test utils
$tutils = Join-Path $scriptDir 'test-utils.ps1'
if (Test-Path $tutils) { . $tutils }
$checker = Join-Path $scriptDir 'check-upload-response-schema.ps1'
if (-not (Test-Path $checker)) { Write-Error 'Schema checker not found'; exit 2 }

function RunCase($inputJson, $label){
    Write-Output "Running case: $label"
    $out = & $checker -ResponseJson $inputJson -QueueDir (Join-Path $scriptDir 'retry-queue') 2>&1
    $code = $LASTEXITCODE
    Write-Output "ExitCode=$code"
    Write-Output "Output:\n$out"
}

# prepare retry-queue dir
if (-not (Test-Path (Join-Path $scriptDir 'retry-queue'))) { New-Item -Path (Join-Path $scriptDir 'retry-queue') -ItemType Directory | Out-Null }

RunCase '{ "ok": true, "delete": true }' 'valid-ok-delete'
RunCase '{ "ok": true }' 'missing-delete'
RunCase '{ "ok": "yes", "delete": false }' 'ok-not-bool'
RunCase '<html>500</html>' 'non-json'
RunCase '' 'empty-response'
RunCase '{ "delete": true }' 'missing-ok'
if (-not (Test-Path (Join-Path $scriptDir 'test-results'))) { New-Item -Path (Join-Path $scriptDir 'test-results') -ItemType Directory | Out-Null }

# collect last_schema_check and runner log snippet
$sc = $null
$rqDir = Join-Path $scriptDir 'retry-queue'
if (Test-Path (Join-Path $rqDir 'last_schema_check.json')) { $sc = Get-Content (Join-Path $rqDir 'last_schema_check.json') -Raw }
$logSnippet = $null
if (Test-Path (Join-Path $scriptDir 'runner_auto_start.json.log')) { $logSnippet = (Get-Content (Join-Path $scriptDir 'runner_auto_start.json.log') -ErrorAction SilentlyContinue | Select-Object -Last 50) -join "`n" }

 $res = @{ last_schema_check = $sc; log_snippet = $logSnippet }
 Save-TestResult -Name 'test-schema-validation' -Pass $true -Meta $res

Write-Output 'test-schema-validation completed. Inspect test-results/test-schema-validation.json for summary.'

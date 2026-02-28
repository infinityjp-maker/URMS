param(
    [string]$RunId
)

if (-not $RunId) { Write-Error 'RunId required'; exit 2 }

for ($i=0; $i -lt 360; $i++) {
    $s = gh run view $RunId --repo infinityjp-maker/URMS --json status,conclusion --jq '.status + " " + (.conclusion // "")' 2>$null
    Write-Output "[$i] $s"
    if ($s -and $s -match 'completed') { break }
    Start-Sleep -Seconds 5
}

gh run view $RunId --repo infinityjp-maker/URMS --log > .github/actions-runs/last-smoke-run-$RunId.log
gh run download $RunId --repo infinityjp-maker/URMS --dir .github/actions-runs/run-$RunId
if ($LASTEXITCODE -ne 0) { Write-Output 'download returned non-zero' }
Write-Output 'done'

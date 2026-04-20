$tok = gh auth token
$base = 'https://api.github.com/repos/infinityjp-maker/URMS/actions/artifacts'
$ids = @(6387013187,6387012975,6387012820)
$outdir = '.gh-run-scripts/selfhosted_repair/api_checks/artifacts_24287510612'
if (-not (Test-Path $outdir)) { New-Item -ItemType Directory -Path $outdir | Out-Null }
foreach ($id in $ids) {
    $url = "$base/$id/zip"
    $out = Join-Path $outdir ("artifact_$id.zip")
    Write-Output "Downloading $url -> $out"
    Invoke-WebRequest -Uri $url -Headers @{ Authorization = "token $tok" } -OutFile $out -UseBasicParsing -ErrorAction Stop
}
Expand-Archive -LiteralPath (Join-Path $outdir 'artifact_6387013187.zip') -DestinationPath (Join-Path $outdir 'selfheal-production-artifacts') -Force
Expand-Archive -LiteralPath (Join-Path $outdir 'artifact_6387012975.zip') -DestinationPath (Join-Path $outdir 'selfheal-final-info') -Force
Expand-Archive -LiteralPath (Join-Path $outdir 'artifact_6387012820.zip') -DestinationPath (Join-Path $outdir 'selfheal-test-artifact') -Force
$tgz = Join-Path $outdir 'selfheal-production-artifacts/selfheal_logs.tgz'
if (Test-Path $tgz) { tar -xzf $tgz -C (Join-Path $outdir 'selfheal-production-artifacts') }
Get-ChildItem -Path $outdir -Recurse | Select-Object FullName,Length | Format-List

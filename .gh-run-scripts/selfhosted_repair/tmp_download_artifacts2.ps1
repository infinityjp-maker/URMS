$tok = gh auth token
$base = 'https://api.github.com/repos/infinityjp-maker/URMS/actions/artifacts'
$ids = @(6387106144,6387106096,6387106056,6387106017,6387105975,6387105940,6387105875,6387105832,6387105795,6387105420)
$outdir = '.gh-run-scripts/selfhosted_repair/api_checks/artifacts_24287836118'
if (Test-Path $outdir) { Remove-Item -Recurse -Force $outdir -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $outdir | Out-Null
foreach ($id in $ids) {
    $url = "$base/$id/zip"
    $out = Join-Path $outdir ("artifact_$id.zip")
    Write-Output "Downloading $url -> $out"
    Invoke-WebRequest -Uri $url -Headers @{ Authorization = "token $tok" } -OutFile $out -UseBasicParsing -ErrorAction Stop
    try { Expand-Archive -LiteralPath $out -DestinationPath (Join-Path $outdir "artifact_$id") -Force } catch {}
}
# Extract production logs tgz if present
$prodLogs = Join-Path $outdir 'artifact_6387106144/selfheal_logs.tgz'
if (Test-Path $prodLogs) { tar -xzf $prodLogs -C (Join-Path $outdir 'artifact_6387106144') }
Get-ChildItem -Path $outdir -Recurse | Select-Object FullName,Length | Format-List

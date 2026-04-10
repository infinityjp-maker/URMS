$workdir = 'D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair'
Set-Location $workdir
"Writing diagnostics to $workdir"
Get-ChildItem -Path $workdir -Filter 'actions-runner*.zip' -File -ErrorAction SilentlyContinue | Select-Object FullName,Length | Format-List | Out-File zip_list.txt
Get-ChildItem -Path $workdir -Filter 'actions-runner*.zip' -File -ErrorAction SilentlyContinue | ForEach-Object { "$($_.FullName) $((Get-FileHash $_.FullName -Algorithm SHA256).Hash) $($_.Length)" } | Out-File zip_hashes.txt
$svc = 'D:\GitHub\URMS\actions-runner-extracted\bin\RunnerService.exe'
if (Test-Path $svc) {
    Get-Item $svc | Select-Object FullName,Length,Attributes | Format-List | Out-File svc_info.txt
    (Get-FileHash $svc -Algorithm SHA256).Hash | Out-File svc_hash.txt
    Get-ChildItem -Path (Split-Path $svc -Parent) -File | Select-Object Name,Length | Out-File svc_bin_listing.txt
} else {
    'NO_SVC' | Out-File svc_info.txt
}
Get-ChildItem -Path 'D:\GitHub\URMS\actions-runner-extracted' -Recurse | Where-Object { -not $_.PSIsContainer } | Select-Object FullName,Length | Out-File extract_listing.txt
"DIAGNOSTICS_WRITTEN" | Out-File diagnostics_done.txt

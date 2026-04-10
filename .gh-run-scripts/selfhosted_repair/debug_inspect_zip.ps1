$workdir='D:\GitHub\URMS\.gh-run-scripts\selfhosted_repair'
$out='debug_actions-runner-2.332.0.zip'
$url='https://github.com/actions/runner/releases/download/v2.332.0/actions-runner-win-x64-2.332.0.zip'
Set-Location $workdir
Write-Output "Downloading $url -> $out"
Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -ErrorAction Stop
Write-Output 'Downloaded'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z=[System.IO.Compression.ZipFile]::OpenRead((Join-Path $workdir $out))
$entry = $z.Entries | Where-Object { $_.FullName -like '*bin/RunnerService.exe' -or $_.FullName -like '*bin\\RunnerService.exe' }
if ($entry) {
    Write-Output "Entry: $($entry.FullName) CompSize=$($entry.CompressedLength) Uncomp=$($entry.Length)"
    $entry | Select FullName,CompressedLength,Length | Format-List | Out-File zip_entry_info.txt
} else {
    Write-Output 'No entry found'
}
$z.Dispose()
Write-Output 'INSPECTION_DONE'

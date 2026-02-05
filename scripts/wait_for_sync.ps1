$i = 0
$max = 30
$logPath = 'D:\GitHub\URMS\logs\urms_rCURRENT.log'
while ($i -lt $max) {
    Start-Sleep -Seconds 2
    if (Test-Path $logPath) {
        $t = Get-Content $logPath -Tail 200 -ErrorAction SilentlyContinue
        if ($t -match 'Periodic calendar sync succeeded') {
            Write-Host 'sync-ok'
            exit 0
        } else {
            Write-Host "waiting... ($i)"
        }
    } else {
        Write-Host 'log missing'
    }
    $i++
}
Write-Host 'timeout'
exit 2

Get-Process -Name urms -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 200
cmd /C 'set "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222" && start "" "d:\GitHub\URMS\Backend\src-tauri\target\release\urms.exe"'
$max = 15
for ($i=0; $i -lt $max; $i++) {
  Start-Sleep -Seconds 1
  try {
    $list = Invoke-RestMethod -Uri 'http://127.0.0.1:9222/json/list' -TimeoutSec 2
    Write-Output ($list | ConvertTo-Json -Depth 5)
    exit 0
  } catch {
    Write-Output "waiting for CDP... ($($i+1)/$max)"
  }
}
Write-Output 'CDP not available after wait'
exit 2

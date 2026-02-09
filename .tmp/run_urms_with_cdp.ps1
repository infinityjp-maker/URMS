Get-Process -Name urms -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
cmd /C 'set "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222" && start "" "d:\GitHub\URMS\Backend\src-tauri\target\release\urms.exe"'
Start-Sleep -Seconds 3
try {
  $res = Invoke-RestMethod -Uri 'http://127.0.0.1:9222/json/list' -TimeoutSec 2
  $res | ConvertTo-Json -Depth 5
} catch {
  Write-Output 'CDP not reachable'
}
netstat -ano | findstr :9222
Write-Output '--- last 200 lines of logs/urms_rCURRENT.log ---'
if (Test-Path 'logs/urms_rCURRENT.log') {
  Get-Content -Path 'logs/urms_rCURRENT.log' -Tail 200
} else { Write-Output 'log file not found: logs/urms_rCURRENT.log' }

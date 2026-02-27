# Kill all PowerShell / pwsh terminals except this script's process
$me = Get-CimInstance Win32_Process -Filter "ProcessId = $PID"
$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'powershell.exe|pwsh.exe' }
$targets = $procs | Where-Object { $_.ProcessId -ne $me.ProcessId }
$report = @{ killed = @(); failed = @() }
foreach ($t in $targets) {
  try {
    Stop-Process -Id $t.ProcessId -Force -ErrorAction Stop
    $report.killed += @{ pid = $t.ProcessId; cmd = $t.CommandLine }
  } catch {
    $report.failed += @{ pid = $t.ProcessId; err = $_.Exception.Message }
  }
}
$report | ConvertTo-Json -Depth 6

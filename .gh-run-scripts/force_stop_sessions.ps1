Write-Output '--- FORCE STOP SESSIONS START ---'

# gh auth logout
try {
  if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Output 'Running: gh auth logout --hostname github.com -y'
    gh auth logout --hostname github.com -y 2>&1 | ForEach-Object { Write-Output $_ }
    Write-Output 'gh auth logout attempted'
  } else { Write-Output 'gh CLI not found; skipping gh logout' }
} catch {
  Write-Output "gh logout error: $_"
}

# Stop ssh-agent service if exists
try {
  $svc = Get-Service -Name ssh-agent -ErrorAction SilentlyContinue
  if ($svc) {
    Write-Output "ssh-agent service status: $($svc.Status)"
    if ($svc.Status -ne 'Stopped') {
      Stop-Service -Name ssh-agent -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 1
      Write-Output 'ssh-agent service stopped'
    } else { Write-Output 'ssh-agent service already stopped' }
  } else {
    Write-Output 'ssh-agent service not present'
  }
} catch {
  Write-Output "Error stopping ssh-agent service: $_"
}

# Kill SSH related processes
$sshProcs = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -in @('ssh','sshd','ssh-agent') }
if ($sshProcs) {
  foreach ($p in $sshProcs) {
    try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; Write-Output "Stopped $($p.ProcessName) pid=$($p.Id)" } catch { Write-Output "Failed to stop $($p.ProcessName) pid=$($p.Id): $_" }
  }
} else { Write-Output 'No SSH-related processes found' }

# List current pwsh processes
$allPwsh = Get-Process -Name pwsh -ErrorAction SilentlyContinue
if ($allPwsh) { Write-Output 'pwsh processes:'; $allPwsh | Select-Object Id,ProcessName,StartTime | ForEach-Object { Write-Output "  pid=$($_.Id) name=$($_.ProcessName) started=$($_.StartTime)" } } else { Write-Output 'No pwsh processes found' }

# Kill other pwsh processes except this one
$currentPid = $PID
$killed = $false
Get-Process -Name pwsh -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $currentPid } | ForEach-Object {
  try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue; Write-Output "Killed pwsh pid=$($_.Id)"; $killed = $true } catch { Write-Output "Failed to kill pwsh pid=$($_.Id): $_" }
}
if (-not $killed) { Write-Output 'No other pwsh processes were killed' }

# Optionally close VS Code terminals: send info (cannot programmatically close external UI reliably)
Write-Output 'Note: VS Code terminal UI sessions may remain; close them in the editor if needed.'

Write-Output '--- FORCE STOP SESSIONS END ---'
exit 0

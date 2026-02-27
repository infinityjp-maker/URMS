$json = Get-Content .github/actions-runs/ps_procs.json -Raw | ConvertFrom-Json
$candidates = $json | Where-Object { $_.childCount -eq 0 -and $_.cmd -match 'shellIntegration.ps1' -and $_.cmd -notmatch 'PowerShellEditorServices' -and $_.cmd -notmatch 'list_ps_procs.ps1' -and $_.cmd -notmatch 'gh-run-watcher.ps1' -and $_.cmd -notmatch 'smoke.cjs' }
$killed = @()
foreach($c in $candidates){ try{ Stop-Process -Id $c.pid -Force -ErrorAction Stop; $killed += @{ pid = $c.pid; cmd = $c.cmd } } catch { }
}
$killed | ConvertTo-Json -Depth 4

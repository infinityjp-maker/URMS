$json = Get-Content .github/actions-runs/ps_procs.json -Raw | ConvertFrom-Json
$candidates = $json | Where-Object { $_.childCount -eq 0 -and $_.cmd -match 'shellIntegration.ps1' -and $_.cmd -notmatch 'PowerShellEditorServices' -and $_.cmd -notmatch 'list_ps_procs.ps1' -and $_.cmd -notmatch 'gh-run-watcher.ps1' -and $_.cmd -notmatch 'smoke.cjs' }
$candidates | ConvertTo-Json -Depth 4

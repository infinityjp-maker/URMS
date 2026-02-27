$candidates = Get-Content .github/actions-runs/candidates.json -Raw | ConvertFrom-Json
$killed = @()
$failed = @()
foreach($c in $candidates){
  try{
    Stop-Process -Id $c.pid -Force -ErrorAction Stop
    $killed += @{ pid = $c.pid; cmd = $c.cmd }
  } catch {
    $failed += @{ pid = $c.pid; err = $_.Exception.Message }
  }
}
@{ killed = $killed; failed = $failed } | ConvertTo-Json -Depth 6

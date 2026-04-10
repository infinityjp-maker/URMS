$repo='infinityjp-maker/URMS'
$branch='validate/final-trigger-test'
$max=12
$found=$false
for ($i=1;$i -le $max;$i++){
  Write-Output ("Attempt {0}/{1}: querying runs..." -f $i,$max)
  $out = gh api repos/$repo/actions/runs?per_page=50 2>&1
  if ($LASTEXITCODE -ne 0){ Write-Output "gh api failed:`n$out"; exit 1 }
  $aj = $out | ConvertFrom-Json
  $c = $aj.workflow_runs | Where-Object { ($_.name -match 'selfheal-validate') -and ($_.head_branch -eq $branch) -and ($_.event -eq 'push') } | Sort-Object created_at -Descending
  if ($c -and $c.Count -gt 0){ $r=$c[0]; $found=$true; break }
  Start-Sleep -Seconds 5
}
if (-not $found){ Write-Output 'No run found'; exit 2 }
$runId=$r.id; $status=$r.status; $conclusion=$r.conclusion
Write-Output "Found run id=$runId status=$status conclusion=$conclusion"
$jobs = gh api repos/$repo/actions/runs/$runId/jobs 2>&1
if ($LASTEXITCODE -ne 0){ Write-Output "jobs api failed:`n$jobs"; exit 3 }
$jobsJ = $jobs | ConvertFrom-Json
Write-Output "jobs_count=$($jobsJ.total_count)"
exit 0

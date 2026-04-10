$repo='infinityjp-maker/URMS'
$branch='validate/final-trigger-test'
for ($i=0;$i -lt 12;$i++){
  Write-Output "poll #$($i+1)"
  $json = gh api repos/$repo/actions/runs --jq ".workflow_runs[] | select(.head_branch==\"$branch\") | {id:.id,status:.status,conclusion:.conclusion} | @json" 2>$null
  if ($json) {
    $obj = $json | ConvertFrom-Json
    $id = $obj.id
    $status = $obj.status
    $conclusion = $obj.conclusion
    $jobs = gh api repos/$repo/actions/runs/$id/jobs --jq ".jobs | length" 2>$null
    Write-Output "FOUND runId=$id status=$status conclusion=$conclusion jobs_count=$jobs"
    exit 0
  }
  Start-Sleep -Seconds 8
}
Write-Output 'NO_RUN_DETECTED'
exit 0

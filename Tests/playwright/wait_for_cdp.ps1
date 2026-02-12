param(
    [int]$Port = 9222,
    [int]$MaxSeconds = 180
)

$url = "http://127.0.0.1:$Port/json/list"
Write-Output "Waiting for CDP at $url (timeout ${MaxSeconds}s)"
for ($i=1; $i -le $MaxSeconds; $i++) {
    try {
        # increase per-request timeout slightly and log failures
        $r = Invoke-RestMethod -Uri $url -TimeoutSec 5
        if ($r) {
            Write-Output "CDP_AVAILABLE (after $i attempts)"
            $r | ConvertTo-Json -Depth 4 | Write-Output
            exit 0
        }
    } catch {
        Write-Output "CDP attempt $i failed: $($_.Exception.Message)"
    }
    # small backoff between attempts
    Start-Sleep -Seconds 2
}
Write-Error "Timeout waiting for CDP at $url after ${MaxSeconds}s"
exit 1

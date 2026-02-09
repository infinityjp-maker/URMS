param(
    [int]$Port = 9222,
    [int]$MaxSeconds = 60
)

$url = "http://127.0.0.1:$Port/json/list"
Write-Output "Waiting for CDP at $url (timeout ${MaxSeconds}s)"
for ($i=0; $i -lt $MaxSeconds; $i++) {
    try {
        $r = Invoke-RestMethod -Uri $url -TimeoutSec 2
        if ($r) {
            Write-Output 'CDP_AVAILABLE'
            $r | ConvertTo-Json -Depth 4 | Write-Output
            exit 0
        }
    } catch {
        Write-Output "CDP attempt $i failed"
    }
    Start-Sleep -Seconds 1
}
Write-Error "Timeout waiting for CDP at $url"
exit 1

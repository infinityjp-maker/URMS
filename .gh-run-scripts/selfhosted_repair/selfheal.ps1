# selfheal.ps1
# Production selfheal script placeholder
# User will provide full logic later

# Phase1: basic logging
Write-Output "[selfheal] Phase1 start"
Write-Output "[selfheal] Timestamp: $(Get-Date -Format o)"
try {
	$logPath = Join-Path $PSScriptRoot "selfheal_log_phase1.txt"
	"Phase1 start" | Out-File -FilePath $logPath -Encoding utf8
	"Timestamp: $(Get-Date -Format o)" | Out-File -FilePath $logPath -Append -Encoding utf8
} catch {
	Write-Output "[selfheal] Failed to write log: $_"
}

# Phase2: environment diagnostics and detailed logging
Write-Output "[selfheal] Phase2 start"
try {
	$logPath2 = Join-Path $PSScriptRoot "selfheal_log_phase2.txt"
	"Phase2 start" | Out-File -FilePath $logPath2 -Encoding utf8
	"Timestamp: $(Get-Date -Format o)" | Out-File -FilePath $logPath2 -Append -Encoding utf8

	"PS Script Path: $PSCommandPath" | Out-File -FilePath $logPath2 -Append -Encoding utf8

	"OS Version: $([System.Environment]::OSVersion)" | Out-File -FilePath $logPath2 -Append -Encoding utf8
	"PowerShell Version: $($PSVersionTable.PSVersion)" | Out-File -FilePath $logPath2 -Append -Encoding utf8
	"Current Location: $(Get-Location)" | Out-File -FilePath $logPath2 -Append -Encoding utf8

	"Drives and Free Space:" | Out-File -FilePath $logPath2 -Append -Encoding utf8
	Get-PSDrive | Where-Object { $_.Free -ne $null } | ForEach-Object { "$($_.Name): Free=$($_.Free) Used=$($_.Used)" } | Out-File -FilePath $logPath2 -Append -Encoding utf8

} catch {
	Write-Output "[selfheal] Exception during phase2 diagnostics: $_"
	try {
		$errPath = Join-Path $PSScriptRoot "selfheal_error_phase2.txt"
		"Exception: $_" | Out-File -FilePath $errPath -Encoding utf8
	} catch {}
	exit 1
}

# If reached here, exit success
# Phase3: runner diagnostics
Write-Output "[selfheal] Phase3 start"
try {
	# Determine repository root (two levels up from script folder)
	$repoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
	Write-Output "[selfheal] Repo root: $repoRoot"

	$found = Get-ChildItem -Path $repoRoot -Filter RunnerService.exe -Recurse -ErrorAction SilentlyContinue -Force | Select-Object -First 1
	$logPath3 = Join-Path $PSScriptRoot "selfheal_log_phase3.txt"
	if ($found) {
		$exePath = $found.FullName
		"Found RunnerService.exe at: $exePath" | Out-File -FilePath $logPath3 -Encoding utf8
		$size = (Get-Item $exePath).Length
		"SizeBytes: $size" | Out-File -FilePath $logPath3 -Append -Encoding utf8

		if ($size -eq 16384) {
			"Detected truncated RunnerService.exe (16KB)" | Out-File -FilePath (Join-Path $PSScriptRoot "selfheal_detected_issue.txt") -Encoding utf8
			exit 10
		}

		# Compute SHA256
		try {
			$hash = Get-FileHash -Path $exePath -Algorithm SHA256
			"SHA256: $($hash.Hash)" | Out-File -FilePath $logPath3 -Append -Encoding utf8
		} catch {
			"Failed to compute hash: $_" | Out-File -FilePath $logPath3 -Append -Encoding utf8
		}
	} else {
		"RunnerService.exe not found under repo root" | Out-File -FilePath $logPath3 -Encoding utf8
	}
} catch {
	Write-Output "[selfheal] Exception during phase3 diagnostics: $_"
	try {
		$errPath3 = Join-Path $PSScriptRoot "selfheal_error_phase3.txt"
		"Exception: $_" | Out-File -FilePath $errPath3 -Encoding utf8
	} catch {}
	exit 1
}

exit 0

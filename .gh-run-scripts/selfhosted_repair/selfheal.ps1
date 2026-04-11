# selfheal.ps1
# Production selfheal script placeholder
# User will provide full logic later

# Phase1: basic logging
$prodPrefix = "[PRODUCTION RUN] "
Write-Output "${prodPrefix}[selfheal] Phase1 start"
Write-Output "${prodPrefix}[selfheal] Timestamp: $(Get-Date -Format o)"
try {
	$logPath = Join-Path $PSScriptRoot "selfheal_log_phase1.txt"
	"${prodPrefix}Phase1 start" | Out-File -FilePath $logPath -Encoding utf8
	"${prodPrefix}Timestamp: $(Get-Date -Format o)" | Out-File -FilePath $logPath -Append -Encoding utf8
} catch {
	Write-Output "${prodPrefix}[selfheal] Failed to write log: $_"
}

# Phase2: environment diagnostics and detailed logging
Write-Output "[selfheal] Phase2 start"
try {
	$logPath2 = Join-Path $PSScriptRoot "selfheal_log_phase2.txt"
	"${prodPrefix}Phase2 start" | Out-File -FilePath $logPath2 -Encoding utf8
	"${prodPrefix}Timestamp: $(Get-Date -Format o)" | Out-File -FilePath $logPath2 -Append -Encoding utf8

	"${prodPrefix}PS Script Path: $PSCommandPath" | Out-File -FilePath $logPath2 -Append -Encoding utf8

	"${prodPrefix}OS Version: $([System.Environment]::OSVersion)" | Out-File -FilePath $logPath2 -Append -Encoding utf8
	"${prodPrefix}PowerShell Version: $($PSVersionTable.PSVersion)" | Out-File -FilePath $logPath2 -Append -Encoding utf8
	"${prodPrefix}Current Location: $(Get-Location)" | Out-File -FilePath $logPath2 -Append -Encoding utf8

	"${prodPrefix}Drives and Free Space:" | Out-File -FilePath $logPath2 -Append -Encoding utf8
	Get-PSDrive | Where-Object { $_.Free -ne $null } | ForEach-Object { "${prodPrefix}$($_.Name): Free=$($_.Free) Used=$($_.Used)" } | Out-File -FilePath $logPath2 -Append -Encoding utf8

} catch {
	Write-Output "${prodPrefix}[selfheal] Exception during phase2 diagnostics: $_"
	try {
		$errPath = Join-Path $PSScriptRoot "selfheal_error_phase2.txt"
		"${prodPrefix}Exception: $_" | Out-File -FilePath $errPath -Encoding utf8
		# production-specific error file
		$prodErr = Join-Path $PSScriptRoot "selfheal_error_production.txt"
		"${prodPrefix}Exception during Phase2: $_" | Out-File -FilePath $prodErr -Encoding utf8
	} catch {}
	exit 30
}

# If reached here, exit success
# Phase3: runner diagnostics
# Phase3: runner diagnostics
Write-Output "${prodPrefix}[selfheal] Phase3 start"
# initialize repair flag
$doRepair = $false
try {
# initialize repair flag
$doRepair = $false
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
			"${prodPrefix}Detected truncated RunnerService.exe (16KB)" | Out-File -FilePath (Join-Path $PSScriptRoot "selfheal_detected_issue.txt") -Encoding utf8
			# mark for repair and continue to Phase4
			$doRepair = $true
			"${prodPrefix}Marked for repair (doRepair=$doRepair)" | Out-File -FilePath $logPath3 -Append -Encoding utf8
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
	Write-Output "${prodPrefix}[selfheal] Exception during phase3 diagnostics: $_"
	try {
		$errPath3 = Join-Path $PSScriptRoot "selfheal_error_phase3.txt"
		"${prodPrefix}Exception: $_" | Out-File -FilePath $errPath3 -Encoding utf8
		$prodErr = Join-Path $PSScriptRoot "selfheal_error_production.txt"
		"${prodPrefix}Exception during Phase3: $_" | Out-File -FilePath $prodErr -Encoding utf8
	} catch {}
	exit 30
}


# Phase4: attempt safe repair when truncated runner detected
Write-Output "${prodPrefix}[selfheal] Phase4 start"
try {
	$logPath4 = Join-Path $PSScriptRoot "selfheal_log_phase4.txt"
	$repairLog = Join-Path $PSScriptRoot "selfheal_repair_log.txt"

	# Trace file for step-by-step repair trace
	$tracePath = Join-Path $PSScriptRoot "selfheal_repair_trace.txt"
	"${prodPrefix}Repair trace start: $(Get-Date -Format o)" | Out-File -FilePath $tracePath -Encoding utf8
	"${prodPrefix}Phase4 start: $(Get-Date -Format o)" | Out-File -FilePath $logPath4 -Encoding utf8

	# If a detected issue file exists or size was detected earlier, re-check
	$issueFile = Join-Path $PSScriptRoot "selfheal_detected_issue.txt"
	if (Test-Path $issueFile -PathType Leaf) {
		"${prodPrefix}Detected issue file present: $issueFile" | Out-File -FilePath $logPath4 -Encoding utf8
	}

	# Determine whether to attempt repair: flagged during Phase3 or issue file exists or current size indicates truncation
	$shouldRepair = $doRepair -or (Test-Path $issueFile -PathType Leaf) -or ($found -and (Get-Item $found.FullName).Length -eq 16384)
	if ($shouldRepair) {
		# Start repair
		"Repair start: $(Get-Date -Format o)" | Out-File -FilePath (Join-Path $PSScriptRoot "selfheal_repair_start.txt") -Encoding utf8

		# Find a ZIP in the repair folder (expect runner_production.zip)
		"${prodPrefix}Looking for runner_production.zip under $PSScriptRoot" | Out-File -FilePath $repairLog -Append -Encoding utf8
		$zip = Get-ChildItem -Path $PSScriptRoot -Filter runner_production.zip -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
		if (-not $zip) {
			# fallback: any zip
			"${prodPrefix}runner_production.zip not found, searching any zip file" | Out-File -FilePath $repairLog -Append -Encoding utf8
			$zip = Get-ChildItem -Path $PSScriptRoot -Filter *.zip -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
		}
		if (-not $zip) {
			"${prodPrefix}No zip found to extract; aborting repair" | Out-File -FilePath $repairLog -Encoding utf8
			"${prodPrefix}No zip found to extract; aborting repair" | Out-File -FilePath $tracePath -Append -Encoding utf8
			"${prodPrefix}Phase4 aborted: no zip" | Out-File -FilePath $logPath4 -Append -Encoding utf8
			exit 20
		}

		# Log zip details to trace and repair log
		try {
			$zipPath = $zip.FullName
			$zipSize = (Get-Item $zipPath).Length
			"${prodPrefix}Zip found: $zipPath" | Out-File -FilePath $repairLog -Append -Encoding utf8
			"${prodPrefix}Zip size: $zipSize" | Out-File -FilePath $repairLog -Append -Encoding utf8
			"ZipPath: $zipPath" | Out-File -FilePath $tracePath -Append -Encoding utf8
			"ZipAbsolutePath: $zipPath" | Out-File -FilePath $tracePath -Append -Encoding utf8
			"ZipSize: $zipSize" | Out-File -FilePath $tracePath -Append -Encoding utf8
			# Additional explicit trace entries to capture execution environment
			Add-Content -Path (Join-Path $PSScriptRoot "selfheal_repair_trace.txt") -Value ("Trace: ZIP path = $zipPath")
			Add-Content -Path (Join-Path $PSScriptRoot "selfheal_repair_trace.txt") -Value ("Trace: PSScriptRoot=$PSScriptRoot")
			Add-Content -Path (Join-Path $PSScriptRoot "selfheal_repair_trace.txt") -Value ("Trace: GITHUB_WORKSPACE=$env:GITHUB_WORKSPACE")
		} catch {
			"${prodPrefix}Failed to stat zip: $_" | Out-File -FilePath $repairLog -Append -Encoding utf8
			"Failed to stat zip: $_" | Out-File -FilePath $tracePath -Append -Encoding utf8
		}

		$tmpDir = Join-Path $PSScriptRoot "repair_tmp"
		if (Test-Path $tmpDir) { Remove-Item -Recurse -Force $tmpDir }
		New-Item -ItemType Directory -Path $tmpDir | Out-Null

			# Attempt to extract RunnerService.exe from the zip
			try {
				"${prodPrefix}Expanding zip: $($zip.FullName) to $tmpDir" | Out-File -FilePath $repairLog -Append -Encoding utf8
				"Expanding: $($zip.FullName) -> $tmpDir" | Out-File -FilePath $tracePath -Append -Encoding utf8
				Expand-Archive -Path $zip.FullName -DestinationPath $tmpDir -Force
				"${prodPrefix}Expand-Archive completed" | Out-File -FilePath $repairLog -Append -Encoding utf8
				"${prodPrefix}Expand-Archive completed" | Out-File -FilePath $logPath4 -Append -Encoding utf8
				"Expand-Archive completed" | Out-File -FilePath $tracePath -Append -Encoding utf8
				"${prodPrefix}Extracted files:" | Out-File -FilePath $repairLog -Append -Encoding utf8
				Get-ChildItem -Path $tmpDir -Recurse | ForEach-Object { "${prodPrefix}$($_.FullName) : $($_.Length)" } | Out-File -FilePath $repairLog -Append -Encoding utf8
				Get-ChildItem -Path $tmpDir -Recurse | ForEach-Object { "Extracted: $($_.FullName) : $($_.Length)" } | Out-File -FilePath $tracePath -Append -Encoding utf8
			} catch {
				"${prodPrefix}Expand-Archive failed: $_" | Out-File -FilePath $repairLog -Append -Encoding utf8
				"Expand-Archive failed: $_" | Out-File -FilePath $tracePath -Append -Encoding utf8
				$prodErr = Join-Path $PSScriptRoot "selfheal_error_production.txt"
				"${prodPrefix}Expand-Archive failed: $_" | Out-File -FilePath $prodErr -Encoding utf8
				Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue
				exit 20
			}

			$extracted = Get-ChildItem -Path $tmpDir -Filter RunnerService.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
			if (-not $extracted) {
				"${prodPrefix}RunnerService.exe not found inside zip: $($zip.FullName)" | Out-File -FilePath $repairLog -Append -Encoding utf8
				"RunnerService.exe not found inside zip: $($zip.FullName)" | Out-File -FilePath $tracePath -Append -Encoding utf8
				$prodErr = Join-Path $PSScriptRoot "selfheal_error_production.txt"
				"${prodPrefix}RunnerService.exe not found inside zip: $($zip.FullName)" | Out-File -FilePath $prodErr -Encoding utf8
				Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue
				"${prodPrefix}Phase4 failed: RunnerService.exe not found in zip" | Out-File -FilePath $logPath4 -Append -Encoding utf8
				exit 20
			}

			# Copy over (overwrite) to original location with detailed logging
			try {
				"${prodPrefix}Copying extracted RunnerService.exe from $($extracted.FullName) to $($found.FullName)" | Out-File -FilePath $repairLog -Append -Encoding utf8
				"Copying: $($extracted.FullName) -> $($found.FullName)" | Out-File -FilePath $tracePath -Append -Encoding utf8
				Copy-Item -Path $extracted.FullName -Destination $found.FullName -Force -ErrorAction Stop
				"${prodPrefix}Copy-Item completed" | Out-File -FilePath $repairLog -Append -Encoding utf8
				"${prodPrefix}Copy-Item completed" | Out-File -FilePath $logPath4 -Append -Encoding utf8
				"Copy-Item completed" | Out-File -FilePath $tracePath -Append -Encoding utf8
				$newSize = (Get-Item $found.FullName).Length
				"${prodPrefix}Replaced RunnerService.exe; NewSize: $newSize" | Out-File -FilePath $repairLog -Append -Encoding utf8
				"NewSize: $newSize" | Out-File -FilePath $tracePath -Append -Encoding utf8
				try {
					$newHash = Get-FileHash -Path $found.FullName -Algorithm SHA256
					"${prodPrefix}NewSHA256: $($newHash.Hash)" | Out-File -FilePath $repairLog -Append -Encoding utf8
					"NewSHA256: $($newHash.Hash)" | Out-File -FilePath $tracePath -Append -Encoding utf8
				} catch {
					"${prodPrefix}Failed to compute new hash: $_" | Out-File -FilePath $repairLog -Append -Encoding utf8
					"Failed to compute new hash: $_" | Out-File -FilePath $tracePath -Append -Encoding utf8
				}
				# cleanup
				Remove-Item -Recurse -Force $tmpDir

				# aggregate logs into selfheal_logs directory (include trace)
				try {
					$logsDir = Join-Path $PSScriptRoot "selfheal_logs"
					if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }
					Get-ChildItem -Path $PSScriptRoot -Include "selfheal_*.*","*.log","*.txt","*.json" -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Copy-Item -Path $_.FullName -Destination $logsDir -Force }
					# ensure trace is included
					if (Test-Path $tracePath) { Copy-Item -Path $tracePath -Destination $logsDir -Force }
					"${prodPrefix}Aggregated logs to $logsDir" | Out-File -FilePath $repairLog -Append -Encoding utf8
						"Aggregated logs to $logsDir" | Out-File -FilePath $tracePath -Append -Encoding utf8
						"${prodPrefix}Phase4 completed: repair successful" | Out-File -FilePath $logPath4 -Append -Encoding utf8
				} catch {
					"${prodPrefix}Failed to aggregate logs: $_" | Out-File -FilePath $repairLog -Append -Encoding utf8
					"Failed to aggregate logs: $_" | Out-File -FilePath $tracePath -Append -Encoding utf8
				}

				exit 0
			} catch {
				"${prodPrefix}Failed to copy extracted RunnerService.exe: $_" | Out-File -FilePath $repairLog -Append -Encoding utf8
				"Failed to copy extracted RunnerService.exe: $_" | Out-File -FilePath $tracePath -Append -Encoding utf8
				$prodErr = Join-Path $PSScriptRoot "selfheal_error_production.txt"
				"${prodPrefix}Failed to copy extracted RunnerService.exe: $_" | Out-File -FilePath $prodErr -Encoding utf8
				Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue
				exit 20
			}
	} else {
		"${prodPrefix}RunnerService.exe appears normal or not found; no repair needed" | Out-File -FilePath $logPath4 -Encoding utf8
		exit 0
	}
} catch {
	Write-Output "${prodPrefix}[selfheal] Exception during phase4 repair: $_"
	try {
		"${prodPrefix}Exception: $_" | Out-File -FilePath (Join-Path $PSScriptRoot "selfheal_error_phase4.txt") -Encoding utf8
		$prodErr = Join-Path $PSScriptRoot "selfheal_error_production.txt"
		"${prodPrefix}Exception during Phase4: $_" | Out-File -FilePath $prodErr -Encoding utf8
	} catch {}
	exit 30
}
# Flowfix finalized for PR

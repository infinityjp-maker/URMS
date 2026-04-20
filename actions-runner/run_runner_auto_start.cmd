@echo off
REM Wrapper to start runner_auto_start.ps1
REM - avoids execution policy issues and prevents double-start
setlocal
set SCRIPT_DIR=%~dp0
set PS1=%SCRIPT_DIR%runner_auto_start.ps1
set PIDFILE=%SCRIPT_DIR%runner_auto_start.pid

REM Simple arg parsing for diagnose mode
if "%1"=="--diagnose" (
	echo Running self-diagnostics...
	powershell -NoProfile -Command "try { 
		if (Test-Path '%PIDFILE%') { $raw = Get-Content '%PIDFILE%' -ErrorAction SilentlyContinue; Write-Output 'PIDFILE='+$raw } else { Write-Output 'PIDFILE not found' } ; 
		if (Test-Path '%SCRIPT_DIR%runner_auto_start.log') { Get-Content '%SCRIPT_DIR%runner_auto_start.log' -Tail 50 } else { Write-Output 'log not found' } ; 
		Write-Output 'PowerShell version:'; pwsh -v ; 
		Write-Output 'PATH=' + $env:PATH ; 
		Write-Output 'ExecutionPolicy=' + (Get-ExecutionPolicy -List | Format-Table -AutoSize | Out-String) ; 
		if (Test-Path '%SCRIPT_DIR%runner_auto_start.status.json') { Get-Content '%SCRIPT_DIR%runner_auto_start.status.json' } ; 
		# show recent WARN/ERROR JSON lines from structured log
		try { if (Test-Path '%SCRIPT_DIR%runner_auto_start.json.log') { $lines = Get-Content '%SCRIPT_DIR%runner_auto_start.json.log' -ErrorAction SilentlyContinue | Select-Object -Last 200; $parsed = $lines | ForEach-Object { try { $_ | ConvertFrom-Json } catch { $null } } | Where-Object { $_ -and ($_.level -in @('WARN','ERROR')) } ; Write-Output 'Recent WARN/ERROR (structured JSON):'; $parsed | Select-Object -First 20 | Format-List | Out-String | Write-Output } } catch { Write-Output 'no structured JSON log' } ; 
		# show last schema check
		try { $qd = Join-Path '%SCRIPT_DIR%' 'retry-queue'; $sc = Join-Path $qd 'last_schema_check.json'; if (Test-Path $sc) { Write-Output 'last_schema_check:'; Get-Content $sc -Raw } else { Write-Output 'last_schema_check not found' } } catch { Write-Output 'no last_schema_check available' }
		try { $zip = & '%SCRIPT_DIR%collect-runner-logs.ps1' -RunnerDir '%SCRIPT_DIR%' -OutDir '%SCRIPT_DIR%'; Write-Output 'Collected ZIP=' + $zip } catch { Write-Output 'collect-runner-logs failed: '+$_.Exception.Message } 
	} catch { Write-Output 'diagnose failed: '+$_.Exception.Message }"
	REM show installed modules via pwsh
	powershell -NoProfile -Command "try { Write-Output 'Installed PowerShell modules (sample):'; pwsh -NoProfile -Command \"Get-Module -ListAvailable | Select-Object Name,Version | Format-Table -AutoSize | Out-String\" } catch { Write-Output 'module list failed' }"
	REM show latest test-results JSON summaries
	powershell -NoProfile -Command "try { $tr = Join-Path '%SCRIPT_DIR%' 'test-results'; if (Test-Path $tr) { Get-ChildItem -Path $tr -File | Sort-Object LastWriteTime -Descending | ForEach-Object { Write-Output ('TEST:' + $_.Name); Get-Content $_.FullName -Raw } } else { Write-Output 'no test-results' } } catch { Write-Output 'test-results display failed: '+$_.Exception.Message }"
	exit /b 0
)

	REM show latest monitor result
	powershell -NoProfile -Command "try { $mf = Join-Path '%SCRIPT_DIR%' 'monitor-latest.json'; if (Test-Path $mf) { Write-Output 'Monitor latest:'; Get-Content $mf -Raw } else { Write-Output 'monitor-latest.json not found' } } catch { Write-Output 'monitor display failed: '+$_.Exception.Message }"

	REM TLS / network checks and installed modules
	powershell -NoProfile -Command "try { Write-Output 'SecurityProtocol:'; [Net.ServicePointManager]::SecurityProtocol; Write-Output 'Attempting network check to https://api.github.com (status expected)'; try { $r = Invoke-WebRequest -Uri 'https://api.github.com' -UseBasicParsing -Method Head -TimeoutSec 10; Write-Output ('Network OK: ' + $r.StatusCode) } catch { Write-Output ('Network check failed: ' + $_.Exception.Message) }; Write-Output 'Installed PowerShell modules (sample):'; Get-Module -ListAvailable | Select-Object Name,Version | Out-String } catch { Write-Output 'env checks failed' }"
    
	REM show retry-queue status
	powershell -NoProfile -Command "try { $qd = Join-Path '%SCRIPT_DIR%' 'retry-queue'; if (Test-Path $qd) { $count = (Get-ChildItem -Path $qd -File -ErrorAction SilentlyContinue | Measure-Object).Count; Write-Output 'retry-queue count=' + $count; $idx = Join-Path $qd 'index.json'; if (Test-Path $idx) { $j = Get-Content $idx -Raw | ConvertFrom-Json; Write-Output 'index.count=' + $j.count; Write-Output 'index.deleted_count=' + ($j.deleted_count -as [int]); Write-Output 'index.files='; $j.files } } else { Write-Output 'retry-queue not found' } } catch { Write-Output 'retry-check failed: '+$_.Exception.Message }"

	REM show latest schema check result if available
	powershell -NoProfile -Command "try { $qd = Join-Path '%SCRIPT_DIR%' 'retry-queue'; $sc = Join-Path $qd 'last_schema_check.json'; if (Test-Path $sc) { Write-Output 'last_schema_check.json:'; Get-Content $sc -Raw } else { Write-Output 'last_schema_check.json not found' } } catch { Write-Output 'schema-check display failed: '+$_.Exception.Message }"

	REM show deletion-waiting count (files awaiting server deletion)
	powershell -NoProfile -Command "try { $qd = Join-Path '%SCRIPT_DIR%' 'retry-queue'; if (Test-Path $qd) { $pending = (Get-ChildItem -Path $qd -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -eq '.zip' } | Measure-Object).Count; Write-Output 'deletion_waiting=' + $pending } else { Write-Output 'retry-queue not found' } } catch { Write-Output 'retry-delete-check failed: '+$_.Exception.Message }"

REM If pidfile exists and process is running, exit to avoid double-start; handle corruption
powershell -NoProfile -Command "try { if (Test-Path '%PIDFILE%') { $raw = Get-Content '%PIDFILE%' -ErrorAction SilentlyContinue; $ok = $false; if ($raw -and ($raw -match '^[0-9]+$')) { [int]$pid = $raw -as [int]; if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) { Write-Output 'runner_auto_start already running (pid='+$pid+')'; exit 0 } else { Remove-Item -Path '%PIDFILE%' -ErrorAction SilentlyContinue; $ok = $true } } else { Add-Content -Path '%SCRIPT_DIR%runner_auto_start.log' -Value (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')+' [WARN] pidfile corrupted or non-numeric; removing'; Remove-Item -Path '%PIDFILE%' -ErrorAction SilentlyContinue } } } catch { Add-Content -Path '%SCRIPT_DIR%runner_auto_start.log' -Value (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')+' [WARN] pidfile check failed: '+$_.Exception.Message }"


REM Start new background PowerShell running the script, write PID; retry on failure up to 3 times
set RETRIES=0
:try_start
powershell -NoProfile -Command "try { $p = Start-Process -FilePath pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','%PS1%' -WindowStyle Hidden -PassThru; if ($p -and $p.Id) { $p.Id | Out-File -FilePath '%PIDFILE%' -Encoding utf8; Write-Output 'Started runner_auto_start with pid '+$p.Id } else { Add-Content -Path '%SCRIPT_DIR%runner_auto_start.log' -Value (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')+' [ERROR] Failed to start PowerShell process for runner_auto_start (no pid)'; exit 1 } } catch { Add-Content -Path '%SCRIPT_DIR%runner_auto_start.log' -Value (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')+' [ERROR] Exception starting runner_auto_start: '+$_.Exception.Message; exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
	set /a RETRIES+=1
	if %RETRIES% LEQ 3 (
		echo PowerShell start failed, retrying in 5s (attempt %RETRIES%)
		powershell -NoProfile -Command "Start-Sleep -Seconds 5"
		goto try_start
	) else (
		echo Failed to start runner_auto_start after retries. See %SCRIPT_DIR%runner_auto_start.log
		exit /b 1
	)
)

echo Started runner_auto_start (PID file: %PIDFILE%)
endlocal

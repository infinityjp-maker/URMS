@echo off
REM test-runner-auto-start.cmd
REM Runs diagnose mode of run_runner_auto_start.cmd and captures output to a file
setlocal
set SCRIPT_DIR=%~dp0
set OUT=%SCRIPT_DIR%diagnose_output.txt
echo Running %SCRIPT_DIR%run_runner_auto_start.cmd --diagnose > "%OUT%"
%SCRIPT_DIR%run_runner_auto_start.cmd --diagnose >> "%OUT%" 2>&1
echo Captured diagnose output to %OUT%
type "%OUT%"
REM (kept environment until validation complete)

REM Validate diagnose output contains expected sections
findstr /R /C:"retry-queue count=" "%OUT%" >nul
if %ERRORLEVEL% EQU 0 ( echo PASS: retry-queue count found ) else ( echo FAIL: retry-queue count not found )
findstr /R /C:"index.deleted_count" "%OUT%" >nul
if %ERRORLEVEL% EQU 0 ( echo PASS: index.deleted_count found ) else ( echo FAIL: index.deleted_count not found )
findstr /R /C:"last_schema_check" "%OUT%" >nul
if %ERRORLEVEL% EQU 0 ( echo PASS: last_schema_check found ) else ( echo WARN: last_schema_check not found )
findstr /R /C:"WARN\|ERROR" "%OUT%" >nul
if %ERRORLEVEL% EQU 0 ( echo PASS: WARN/ERROR entries present in diagnose output ) else ( echo WARN: no WARN/ERROR lines found in diagnose output )

REM write test-results JSON
powershell -NoProfile -Command "try { $tr = Join-Path '%SCRIPT_DIR%' 'test-results'; if (-not (Test-Path $tr)) { New-Item -Path $tr -ItemType Directory | Out-Null }; $res = @{ name='test-runner-auto-start'; pass = (%ERRORLEVEL% -eq 0); time = (Get-Date).ToString('o') }; $res | ConvertTo-Json -Compress | Out-File -FilePath (Join-Path $tr 'test-runner-auto-start.json') -Encoding utf8 -Force } catch { Write-Output 'failed to write test-results' }"

endlocal

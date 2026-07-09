@echo off
REM URMS: 本番UI（Tauri）— API + desktop をバックグラウンド起動
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { . '%~dp0_dev-server-utils.ps1'; Start-UrmsDevServers -DesktopTarget tauri -SkipPreview | Out-Null }"
if errorlevel 1 exit /b 1
echo API + Tauri desktop started in background. Logs: .logs\dev\

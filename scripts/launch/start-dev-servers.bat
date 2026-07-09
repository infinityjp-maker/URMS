@echo off
REM URMS: 依存ビルド + 開発サーバー（バックグラウンド · CMD 窓なし）
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev-servers.ps1"
if errorlevel 1 exit /b 1

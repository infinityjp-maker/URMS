@echo off
REM URMS: バックグラウンド dev サーバー停止
cd /d "%~dp0..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-dev-servers.ps1"

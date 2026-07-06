@echo off
REM URMS ローカル環境構築（Docker · DB · migrate · ssot:sync · サーバー起動）
cd /d "%~dp0..\.."
echo URMS environment setup...
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\dev\setup-env.ps1 -StartServers
pause

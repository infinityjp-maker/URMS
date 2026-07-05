@echo off
REM URMS: 依存ビルド + 開発サーバー起動 + ブラウザで Web UI を開く
cd /d "%~dp0..\.."
call npx pnpm@9.15.4 run dev:prepare
start "URMS API" cmd /k "npx pnpm@9.15.4 dev:api"
start "URMS Web" cmd /k "npx pnpm@9.15.4 dev"
start "URMS Wireframes" cmd /k "npx pnpm@9.15.4 wireframes"
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173/"
echo 暫定 Web UI をブラウザで開きました。起動に失敗した場合は scripts\dev\verify-dev.ps1 を実行してください。

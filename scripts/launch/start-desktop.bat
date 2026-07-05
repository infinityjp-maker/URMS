@echo off
REM URMS: 本番UI（窓）— Tauri デスクトップ起動
cd /d "%~dp0..\.."
call npx pnpm@9.15.4 run dev:prepare
start "URMS API" cmd /k "npx pnpm@9.15.4 dev:api"
timeout /t 3 /nobreak >nul
start "URMS Desktop" cmd /k "npx pnpm@9.15.4 dev:desktop"
echo API + 本番UI（Tauri）を起動しました。初回は Rust ビルドに数分かかることがあります。

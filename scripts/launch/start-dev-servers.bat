@echo off
REM URMS: 依存ビルド + 開発サーバー起動 + 本番窓 UI をブラウザで開く
cd /d "%~dp0..\.."
call npx pnpm@9.15.4 run dev:prepare
start "URMS API" cmd /k "npx pnpm@9.15.4 dev:api"
start "URMS Web" cmd /k "npx pnpm@9.15.4 dev"
start "URMS Wireframes" cmd /k "npx pnpm@9.15.4 wireframes:serve"
start "URMS Desktop Web" cmd /k "npx pnpm@9.15.4 dev:desktop:web"
timeout /t 8 /nobreak >nul
start "" "http://127.0.0.1:1420/"
echo.
echo 本番窓 UI:  http://127.0.0.1:1420/
echo 暫定 Web:   http://127.0.0.1:5173/
echo ワイヤー:   http://127.0.0.1:5180/
echo.
echo 起動に失敗した場合: scripts\dev\verify-dev.ps1 を実行してください。

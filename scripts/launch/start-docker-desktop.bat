@echo off
REM URMS: Docker Desktop を起動（インストール済みの場合）
set "DOCKER_EXE=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if not exist "%DOCKER_EXE%" (
  echo Docker Desktop が見つかりません: %DOCKER_EXE%
  pause
  exit /b 1
)
start "" "%DOCKER_EXE%"

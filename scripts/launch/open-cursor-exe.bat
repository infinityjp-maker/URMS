@echo off
REM URMS: Cursor.exe を通常起動（URMS フォルダを開く）
set "CURSOR_EXE=%LOCALAPPDATA%\Programs\cursor\Cursor.exe"
if not exist "%CURSOR_EXE%" (
  echo Cursor が見つかりません: %CURSOR_EXE%
  pause
  exit /b 1
)
start "" "%CURSOR_EXE%" "D:\GitHub\URMS"

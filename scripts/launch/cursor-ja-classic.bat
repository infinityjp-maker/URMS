@echo off
REM URMS: Cursor を日本語クラシック（エディタ）画面で起動する
set "CURSOR_EXE=%LOCALAPPDATA%\Programs\cursor\Cursor.exe"
if not exist "%CURSOR_EXE%" (
  echo Cursor が見つかりません: %CURSOR_EXE%
  pause
  exit /b 1
)
start "" "%CURSOR_EXE%" --classic --locale=ja "D:\GitHub\URMS"

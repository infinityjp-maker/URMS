# Cursor 3.x — 日本語メニューバー復旧（Windows）
# Glass/Agents 画面は言語パック非対応のため --classic --locale=ja で起動する
$ErrorActionPreference = 'Stop'

$CursorExe = Join-Path $env:LOCALAPPDATA 'Programs\cursor\Cursor.exe'
$LaunchArgs = '--classic --locale=ja'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

if (-not (Test-Path $CursorExe)) {
  Write-Error "Cursor が見つかりません: $CursorExe"
}

function Set-Shortcut {
  param(
    [string]$Path,
    [string]$Description
  )

  $dir = Split-Path $Path -Parent
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($Path)
  $shortcut.TargetPath = $CursorExe
  $shortcut.Arguments = "$LaunchArgs `"$RepoRoot`""
  $shortcut.WorkingDirectory = $RepoRoot
  $shortcut.Description = $Description
  $shortcut.Save()
  Write-Host "[OK] $Path"
}

Write-Host 'Cursor 日本語起動を修復します...'
Write-Host "  exe : $CursorExe"
Write-Host "  args: $LaunchArgs"
Write-Host ''

Set-Shortcut -Path (Join-Path $env:USERPROFILE 'Desktop\Cursor.lnk') -Description 'Cursor (日本語・クラシック)'
Set-Shortcut -Path (Join-Path $env:USERPROFILE 'Desktop\Cursor (日本語・エディタ).lnk') -Description 'Cursor (日本語・クラシック)'
Set-Shortcut -Path (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Cursor.lnk') -Description 'Cursor (日本語・クラシック)'

$startMenuNested = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Cursor\Cursor.lnk'
if (Test-Path (Split-Path $startMenuNested -Parent)) {
  Set-Shortcut -Path $startMenuNested -Description 'Cursor (日本語・クラシック)'
}

Write-Host ''
Write-Host '言語パックを再インストールします...'
& cursor --install-extension ms-ceintl.vscode-language-pack-ja --force
if ($LASTEXITCODE -ne 0) {
  Write-Error '言語パックの再インストールに失敗しました'
}

Write-Host ''
Write-Host 'メニューバー見出しの翻訳パッチ + NLS キャッシュ再生成...'
node (Join-Path $PSScriptRoot 'patch-cursor-ja-menubar.mjs')
if ($LASTEXITCODE -ne 0) {
  Write-Error 'メニューバー翻訳パッチに失敗しました'
}

Write-Host ''
Write-Host '完了。Cursor を完全終了してから、デスクトップの Cursor ショートカットで起動してください。'
Write-Host 'メニューが File/Edit のままなら Agents 画面です。Ctrl+Shift+N でエディターウィンドウを開いてください。'

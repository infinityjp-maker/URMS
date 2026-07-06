#!/usr/bin/env node
/**
 * Cursor 3.x / VS Code 1.123+ — メニューバー見出しが英語のままになる既知不具合のパッチ。
 * 言語パックに欠落しているモジュールへ翻訳を追記する:
 * - vs/platform/menubar/electron-main/menubar (macOS / ネイティブメニュー)
 * - vs/workbench/browser/parts/titlebar/menubarControl (Windows カスタムタイトルバー)
 */
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const EXT_GLOB_PREFIX = 'ms-ceintl.vscode-language-pack-ja-';
const ELECTRON_MAIN_MODULE = 'vs/platform/menubar/electron-main/menubar';
const MENUBAR_CONTROL_MODULE = 'vs/workbench/browser/parts/titlebar/menubarControl';
const MENUBAR_CONTRIBUTION_MODULE = 'vs/workbench/browser/parts/titlebar/menubar.contribution';

const MENUBAR_TITLE_JA = {
  mFile: 'ファイル(&&F)',
  mEdit: '編集(&&E)',
  mSelection: '選択(&&S)',
  mView: '表示(&&V)',
  mGoto: '移動(&&G)',
  mRun: '実行(&&R)',
  mTerminal: 'ターミナル(&&T)',
  mHelp: 'ヘルプ(&&H)',
  mPreferences: '基本設定(&&P)',
};

const ELECTRON_MAIN_MENUBAR_JA = {
  ...MENUBAR_TITLE_JA,
  miNewWindow: '新しいウィンドウ(&&W)',
  mWindow: 'ウィンドウ',
  mAbout: 'バージョン情報 {0}',
  miPreferences: '基本設定(&&P)',
  mServices: 'サービス',
  mHide: '{0} を非表示',
  mHideOthers: 'ほかを非表示',
  mShowAll: 'すべて表示',
  miQuit: '{0} を終了',
  quit: '終了(&&Q)',
  cancel: 'キャンセル',
  quitMessage: '終了しますか?',
  mMinimize: '最小化',
  mZoom: 'ズーム',
  mBringToFront: 'すべて前面に移動',
  miSwitchWindow: 'ウィンドウの切り替え(&&W)...',
  mNewTab: '新しいタブ',
  mShowPreviousTab: '前のタブを表示',
  mShowNextTab: '次のタブを表示',
  mMoveTabToNewWindow: 'タブを新しいウィンドウに移動',
  mMergeAllWindows: 'すべてのウィンドウを結合',
  miCheckForUpdates: '更新の確認(&&U)...',
  miCheckingForUpdates: '更新を確認しています...',
  miDownloadUpdate: '更新プログラムのダウンロード(&&O)',
  miDownloadingUpdate: '更新をダウンロードしています...',
  miInstallUpdate: '更新のインストール(&&U)...',
  miInstallingUpdate: '更新プログラムをインストールしています...',
  miRestartToUpdate: '再起動して更新(&&U)',
};

function mergeModuleTranslations(data, moduleKey, translations) {
  const existing = data.contents?.[moduleKey] ?? {};
  data.contents[moduleKey] = { ...existing, ...translations };
}

function findLanguagePackMainJson() {
  const extensionsDir = path.join(os.homedir(), '.cursor', 'extensions');
  if (!existsSync(extensionsDir)) {
    throw new Error(`拡張機能フォルダが見つかりません: ${extensionsDir}`);
  }

  const match = readdirSync(extensionsDir)
    .filter((name) => name.startsWith(EXT_GLOB_PREFIX))
    .sort()
    .at(-1);

  if (!match) {
    throw new Error('Japanese Language Pack が見つかりません');
  }

  return path.join(extensionsDir, match, 'translations', 'main.i18n.json');
}

function clearNlsCache() {
  const clpDir = path.join(process.env.APPDATA ?? '', 'Cursor', 'clp');
  if (!existsSync(clpDir)) {
    return;
  }

  rmSync(clpDir, { recursive: true, force: true });
}

function rebuildNlsCache() {
  const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'rebuild-cursor-nls-cache.mjs');
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error('NLS キャッシュ再生成に失敗しました');
  }
}

function main() {
  const mainJsonPath = findLanguagePackMainJson();
  const raw = readFileSync(mainJsonPath, 'utf8');
  const data = JSON.parse(raw);

  const contributionTitles = data.contents?.[MENUBAR_CONTRIBUTION_MODULE] ?? MENUBAR_TITLE_JA;
  const controlTitles = {
    mFile: contributionTitles.mFile ?? MENUBAR_TITLE_JA.mFile,
    mEdit: contributionTitles.mEdit ?? MENUBAR_TITLE_JA.mEdit,
    mSelection: contributionTitles.mSelection ?? MENUBAR_TITLE_JA.mSelection,
    mView: contributionTitles.mView ?? MENUBAR_TITLE_JA.mView,
    mGoto: contributionTitles.mGoto ?? MENUBAR_TITLE_JA.mGoto,
    mTerminal: contributionTitles.mTerminal ?? MENUBAR_TITLE_JA.mTerminal,
    mHelp: contributionTitles.mHelp ?? MENUBAR_TITLE_JA.mHelp,
    mPreferences: contributionTitles.mPreferences ?? MENUBAR_TITLE_JA.mPreferences,
  };

  mergeModuleTranslations(data, ELECTRON_MAIN_MODULE, ELECTRON_MAIN_MENUBAR_JA);
  mergeModuleTranslations(data, MENUBAR_CONTROL_MODULE, controlTitles);

  writeFileSync(mainJsonPath, `${JSON.stringify(data, null, '\t')}\n`, 'utf8');
  clearNlsCache();
  rebuildNlsCache();

  console.log(`[OK] patched: ${mainJsonPath}`);
  console.log(`[OK] module: ${ELECTRON_MAIN_MODULE}`);
  console.log(`[OK] module: ${MENUBAR_CONTROL_MODULE}`);
}

main();

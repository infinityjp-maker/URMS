#!/usr/bin/env node
/**
 * Cursor / VS Code — languagepacks.json と main.i18n.json から NLS キャッシュ (clp) を再生成する。
 * 言語パックをパッチしたあと、起動前にキャッシュを用意しないとメニュー見出しが英語のままになる。
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const LOCALE = 'ja';
const CURSOR_APP = path.join(
  process.env.LOCALAPPDATA ?? '',
  'Programs',
  'cursor',
  'resources',
  'app',
);
const USER_DATA = path.join(process.env.APPDATA ?? '', 'Cursor');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function resolveCursorCommit() {
  const productPath = path.join(CURSOR_APP, 'product.json');
  if (!existsSync(productPath)) {
    throw new Error(`product.json が見つかりません: ${productPath}`);
  }
  const commit = readJson(productPath).commit;
  if (typeof commit !== 'string' || !commit) {
    throw new Error('Cursor commit が product.json から取得できません');
  }
  return commit;
}

function resolveLanguagePackEntry() {
  const languagePacksPath = path.join(USER_DATA, 'languagepacks.json');
  if (!existsSync(languagePacksPath)) {
    throw new Error(`languagepacks.json が見つかりません: ${languagePacksPath}`);
  }

  const languagePacks = readJson(languagePacksPath);
  const entry = languagePacks[LOCALE];
  if (!entry?.hash || !entry?.translations?.vscode) {
    throw new Error(`languagepacks.json に locale=${LOCALE} のエントリがありません`);
  }

  const mainJsonPath = entry.translations.vscode;
  if (!existsSync(mainJsonPath)) {
    throw new Error(`言語パック main.i18n.json が見つかりません: ${mainJsonPath}`);
  }

  return { entry, mainJsonPath };
}

function buildMergedMessages(nlsKeys, englishMessages, translations) {
  const merged = [];
  let index = 0;

  for (const [moduleName, moduleKeys] of nlsKeys) {
    const moduleTranslations = translations.contents?.[moduleName] ?? {};
    for (const key of moduleKeys) {
      merged.push(moduleTranslations[key] ?? englishMessages[index]);
      index += 1;
    }
  }

  if (index !== englishMessages.length) {
    console.warn(
      `[WARN] メッセージ数不一致: keys=${index}, english=${englishMessages.length}`,
    );
  }

  return merged;
}

function main() {
  const commit = resolveCursorCommit();
  const { entry, mainJsonPath } = resolveLanguagePackEntry();

  const nlsKeysPath = path.join(CURSOR_APP, 'out', 'nls.keys.json');
  const nlsMessagesPath = path.join(CURSOR_APP, 'out', 'nls.messages.json');
  if (!existsSync(nlsKeysPath) || !existsSync(nlsMessagesPath)) {
    throw new Error(`Cursor NLS メタデータが見つかりません: ${CURSOR_APP}`);
  }

  const nlsKeys = readJson(nlsKeysPath);
  const englishMessages = readJson(nlsMessagesPath);
  const translations = readJson(mainJsonPath);
  const mergedMessages = buildMergedMessages(nlsKeys, englishMessages, translations);

  const cacheRoot = path.join(USER_DATA, 'clp', `${entry.hash}.${LOCALE}`);
  const cacheCommitDir = path.join(cacheRoot, commit);
  const messagesFile = path.join(cacheCommitDir, 'nls.messages.json');
  const translationsConfigFile = path.join(cacheRoot, 'tcf.json');
  const corruptMarkerFile = path.join(cacheRoot, 'corrupted.info');

  if (existsSync(corruptMarkerFile)) {
    rmSync(corruptMarkerFile, { force: true });
  }

  mkdirSync(cacheCommitDir, { recursive: true });
  writeFileSync(messagesFile, JSON.stringify(mergedMessages), 'utf8');
  writeFileSync(translationsConfigFile, JSON.stringify(entry.translations), 'utf8');

  const menubarModule = 'vs/platform/menubar/electron-main/menubar';
  const menubarIndex = nlsKeys.findIndex(([name]) => name === menubarModule);
  let offset = 0;
  for (let i = 0; i < menubarIndex; i += 1) {
    offset += nlsKeys[i][1].length;
  }
  const sampleKeys = ['mFile', 'mEdit', 'mView', 'mRun'];
  const sample = Object.fromEntries(
    sampleKeys.map((key, i) => {
      const keyIndex = nlsKeys[menubarIndex][1].indexOf(key);
      return [key, mergedMessages[offset + keyIndex]];
    }),
  );

  console.log(`[OK] NLS cache: ${messagesFile}`);
  console.log(`[OK] tcf.json: ${translationsConfigFile}`);
  console.log(`[OK] commit: ${commit}`);
  console.log(`[OK] menubar sample: ${JSON.stringify(sample)}`);
  console.log('');
  console.log('Cursor を完全終了してから再起動してください。');
}

main();

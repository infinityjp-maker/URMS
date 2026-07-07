import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const stateFile = path.join(process.cwd(), 'e2e', '.e2e-state.json');

test.beforeEach(() => {
  const state = JSON.parse(readFileSync(stateFile, 'utf8')) as { skip?: boolean };
  test.skip(Boolean(state.skip), 'PostgreSQL / API が起動していません（Docker Desktop + db:up が必要）');
});

async function waitForLifeStateReady(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByText('接続確認中…')).toBeHidden({ timeout: 20_000 });
}

test.describe('VT-3/VT-4 desktop perception smoke (1420)', () => {
  test('昼フェーズで本番窓 HTML が描画される', async ({ page }) => {
    await page.goto('/?phase=day');

    await expect(page.locator('.dashboard__brand')).toHaveText('URMS');
    await expect(page.getByText('プレビュー · 昼')).toBeVisible();
    await expect(page.locator('.clock')).not.toBeEmpty();
    await expect(page.getByText('今日のまとめ')).toBeVisible();
    await expect(page.locator('.card-kicker', { hasText: 'タスク' })).toBeVisible();
    await expect(page.locator('.card-kicker', { hasText: '接続' })).toBeVisible();
  });

  test('接続カード — API モード · ソース行（journal / 予定 / Context API）', async ({ page }) => {
    await page.goto('/?phase=day');
    await waitForLifeStateReady(page);

    const outlook = page.getByRole('region', { name: '展望' });
    await expect(outlook.getByText('接続', { exact: true })).toBeVisible();

    const connectionStatus = outlook.locator('.online-line').first();
    await expect(connectionStatus).toContainText(/API 接続/);

    const sourceLine = outlook.locator('.hint-line').first();
    await expect(sourceLine).toContainText('Context API');
    await expect(sourceLine).toContainText(/予定 \d+ 件/);
    await expect(sourceLine).toContainText(/journal (—|\d+ 件)/);

    const weatherPanel = page.getByRole('region', { name: '今' });
    await expect(weatherPanel.locator('.weather-location-label')).toBeVisible();
    await expect(weatherPanel.locator('.weather-location-label')).not.toBeEmpty();
  });

  test('時間帯プレビュー — 夕へ遷移し接続カードは維持 · 天気パネルは非表示', async ({ page }) => {
    await page.goto('/?phase=day');
    await waitForLifeStateReady(page);

    const previewNav = page.getByRole('navigation', { name: '時間帯プレビュー（開発用）' });
    await previewNav.getByRole('link', { name: '夕' }).click();

    await expect(page).toHaveURL(/phase=evening/);
    await expect(page.getByText('プレビュー · 夕')).toBeVisible();
    await expect(page.getByRole('region', { name: '展望' }).getByText('接続', { exact: true })).toBeVisible();

    const primary = page.getByRole('region', { name: '今' });
    await expect(primary.getByText('天気', { exact: true })).toHaveCount(0);
  });

  test('タスクパネル — DB 起動済み時に「完了 → 次へ」が表示される', async ({ page }) => {
    const hour = new Date().getHours();
    const tasksPanelPhase = hour >= 10 && hour < 21;
    test.skip(!tasksPanelPhase, 'タスクパネル非表示の時間帯（朝/夜）— advance smoke をスキップ');

    await page.goto('/');
    await waitForLifeStateReady(page);

    const connectionStatus = page
      .getByRole('region', { name: '展望' })
      .locator('.online-line')
      .first();
    const dbReady = (await connectionStatus.textContent())?.includes('SSOT から合成') ?? false;
    test.skip(!dbReady, 'DB 未起動 — advance ボタン smoke をスキップ');

    await expect(page.getByRole('button', { name: '完了 → 次へ' })).toBeVisible();
  });
});

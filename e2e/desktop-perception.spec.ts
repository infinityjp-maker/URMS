import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const stateFile = path.join(process.cwd(), 'e2e', '.e2e-state.json');

test.beforeEach(() => {
  const state = JSON.parse(readFileSync(stateFile, 'utf8')) as { skip?: boolean };
  test.skip(Boolean(state.skip), 'PostgreSQL / API が起動していません（Docker Desktop + db:up が必要）');
});

async function waitForLifeStateReady(page: import('@playwright/test').Page): Promise<void> {
  const outlook = page.getByRole('region', { name: '展望' });
  await expect(outlook.getByText('接続確認中…')).toBeHidden({ timeout: 20_000 });
}

/** タスクパネル表示 — day(10–17 JST) */
async function installTaskPanelClock(page: import('@playwright/test').Page): Promise<void> {
  await page.clock.install({ time: new Date('2026-07-06T03:00:00.000Z') });
}

async function advanceFrozenClock(page: import('@playwright/test').Page, ms = 5000): Promise<void> {
  await page.clock.runFor(ms);
}

async function ensureAdvanceableContext(page: import('@playwright/test').Page): Promise<void> {
  const response = await page.request.put('http://127.0.0.1:3000/v1/context', {
    headers: {
      'Content-Type': 'application/json',
      'X-URMS-Mode': 'plan',
    },
    data: {
      items: [
        { key: 'current_task', summary: 'E2E current task', ssotLinks: [] },
        { key: 'next_task', summary: 'E2E next task', ssotLinks: [] },
      ],
    },
  });

  expect(response.ok()).toBeTruthy();
}

function parseJournalCount(sourceLine: string | null): number | null {
  if (!sourceLine) {
    return null;
  }

  const match = sourceLine.match(/journal (\d+) 件/);
  if (match) {
    return Number(match[1]);
  }

  return sourceLine.includes('journal —') ? 0 : null;
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
    await installTaskPanelClock(page);
    await ensureAdvanceableContext(page);

    await page.goto('/');
    await advanceFrozenClock(page, 8000);
    await waitForLifeStateReady(page);

    const connectionStatus = page
      .getByRole('region', { name: '展望' })
      .locator('.online-line')
      .first();
    const dbReady = (await connectionStatus.textContent())?.includes('SSOT から合成') ?? false;
    test.skip(!dbReady, 'DB 未起動 — advance ボタン smoke をスキップ');

    await expect(page.getByRole('button', { name: '完了 → 次へ' })).toBeVisible();
  });

  test('VT-4 日次ループ — advance で journal 追記 · statusLine / 接続カード更新', async ({ page }) => {
    await installTaskPanelClock(page);
    await ensureAdvanceableContext(page);

    await page.goto('/');
    await advanceFrozenClock(page, 8000);
    await waitForLifeStateReady(page);

    const outlook = page.getByRole('region', { name: '展望' });
    const connectionStatus = outlook.locator('.online-line').first();
    const dbReady = (await connectionStatus.textContent())?.includes('SSOT から合成') ?? false;
    test.skip(!dbReady, 'DB 未起動 — VT-4 E2E をスキップ');

    const advanceButton = page.getByRole('button', { name: '完了 → 次へ' });
    await expect(advanceButton).toBeVisible();

    const statusBefore = (await page.locator('.status-line').textContent())?.trim() ?? '';
    const sourceBefore = await outlook.locator('.hint-line').first().textContent();
    const journalBefore = parseJournalCount(sourceBefore);

    await advanceButton.click();
    await page.waitForResponse(
      (response) =>
        response.url().includes('/v1/context/advance-task') && response.status() === 200,
      { timeout: 15_000 },
    );
    await advanceFrozenClock(page, 1500);

    await expect(page.locator('.task-action__success')).toContainText('journal.md に追記');
    await advanceFrozenClock(page, 2000);
    await expect(advanceButton).toBeEnabled({ timeout: 15_000 });

    const statusAfter = (await page.locator('.status-line').textContent())?.trim() ?? '';
    const sourceAfter = await outlook.locator('.hint-line').first().textContent();
    const journalAfter = parseJournalCount(sourceAfter);

    expect(statusAfter.length).toBeGreaterThan(0);
    expect(statusAfter).not.toBe(statusBefore);

    if (journalBefore !== null && journalAfter !== null) {
      expect(journalAfter).toBeGreaterThanOrEqual(journalBefore + 1);
    } else {
      expect(sourceAfter).toMatch(/journal \d+ 件|今日ループ済/);
    }
  });
});

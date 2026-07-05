import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { switchMode } from './helpers';

const stateFile = path.join(process.cwd(), 'e2e', '.e2e-state.json');
test.beforeEach(() => {
  const state = JSON.parse(readFileSync(stateFile, 'utf8')) as { skip?: boolean };
  test.skip(Boolean(state.skip), 'PostgreSQL / API が起動していません（Docker Desktop + db:up が必要）');
});

test('UC-005: Mode を切り替えるとナビゲーションが変わる', async ({ page }) => {
  await page.goto('/');

  await switchMode(page, '監査');
  await expect(page.getByRole('link', { name: '監査ログ' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Context' })).toHaveCount(0);

  await switchMode(page, '運用');
  await expect(page.getByRole('link', { name: '監査ログ' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Context' })).toBeVisible();

  await switchMode(page, '計画');
  await expect(page.getByRole('link', { name: 'Context' })).toBeVisible();
});

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { switchMode } from './helpers';

const stateFile = path.join(process.cwd(), 'e2e', '.e2e-state.json');
test.beforeEach(() => {
  const state = JSON.parse(readFileSync(stateFile, 'utf8')) as { skip?: boolean };
  test.skip(Boolean(state.skip), 'PostgreSQL / API が起動していません（Docker Desktop + db:up が必要）');
});

test('UC-006: plan Mode で Context ダッシュボードを表示・更新できる', async ({ page }) => {
  await page.goto('/');
  await switchMode(page, '計画');
  await page.getByRole('link', { name: 'Context' }).click();

  await expect(page.getByRole('heading', { name: 'Context ダッシュボード' })).toBeVisible();

  const taskInput = page.locator('label').filter({ hasText: 'current_task' }).locator('input');
  await taskInput.fill('E2E で更新したタスク');
  await page.getByRole('button', { name: '保存' }).click();

  await expect(page.getByText('Context を保存しました')).toBeVisible();
  await expect(page.getByText('E2E で更新したタスク')).toBeVisible();
});

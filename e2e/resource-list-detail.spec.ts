import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { switchMode } from './helpers';

const stateFile = path.join(process.cwd(), 'e2e', '.e2e-state.json');
test.beforeEach(() => {
  const state = JSON.parse(readFileSync(stateFile, 'utf8')) as { skip?: boolean };
  test.skip(Boolean(state.skip), 'PostgreSQL / API が起動していません（Docker Desktop + db:up が必要）');
});

test('UC-002: Resource 一覧から詳細を開ける', async ({ page }) => {
  const uniqueId = `list-${Date.now()}`;
  const name = `List Target ${uniqueId}`;

  await page.goto('/');
  await switchMode(page, '運用');
  await page.getByRole('link', { name: 'Resource' }).click();
  await page.getByRole('link', { name: '+ 新規作成' }).click();

  await page.getByLabel('種別 (resourceType) *').fill('digital');
  await page.getByLabel('ID (resourceId) *').fill(uniqueId);
  await page.getByLabel('名称 (name) *').fill(name);
  await page.getByLabel('metadata (JSON)').fill(JSON.stringify({ vendor: 'E2E Vendor' }));
  await page.getByRole('button', { name: '作成' }).click();

  await page.getByRole('link', { name: 'Resource' }).click();
  await page.getByPlaceholder('名称').fill(name);
  await page.getByRole('button', { name: '検索' }).click();

  await page.getByRole('link', { name: uniqueId }).click();
  await expect(page.getByRole('heading', { name: `digital : ${uniqueId}` })).toBeVisible();
  await expect(page.getByText(name)).toBeVisible();
});

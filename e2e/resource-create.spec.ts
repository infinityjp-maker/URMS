import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { switchMode } from './helpers';

const stateFile = path.join(process.cwd(), 'e2e', '.e2e-state.json');
test.beforeEach(() => {
  const state = JSON.parse(readFileSync(stateFile, 'utf8')) as { skip?: boolean };
  test.skip(Boolean(state.skip), 'PostgreSQL / API が起動していません（Docker Desktop + db:up が必要）');
});

test('UC-001: operate Mode で Resource を作成できる', async ({ page }) => {
  const uniqueId = `e2e-${Date.now()}`;

  await page.goto('/');
  await switchMode(page, '運用');
  await page.getByRole('link', { name: 'Resource' }).click();
  await page.getByRole('link', { name: '+ 新規作成' }).click();

  await page.getByLabel('種別 (resourceType) *').fill('physical');
  await page.getByLabel('ID (resourceId) *').fill(uniqueId);
  await page.getByLabel('名称 (name) *').fill(`E2E Server ${uniqueId}`);
  await page.getByLabel('metadata (JSON)').fill(JSON.stringify({ location: 'rack-e2e' }));
  await page.getByRole('button', { name: '作成' }).click();

  await expect(page).toHaveURL(new RegExp(`/resources/physical/${uniqueId}$`));
  await expect(page.getByRole('heading', { name: `physical : ${uniqueId}` })).toBeVisible();
});

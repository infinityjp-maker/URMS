import type { Page } from '@playwright/test';

export async function switchMode(page: Page, label: '計画' | '運用' | '監査' | '開発'): Promise<void> {
  await page.getByRole('button', { name: label, exact: true }).click();
}

export function skipIfNoStack(): void {
  if (process.env.E2E_SKIP === '1') {
    throw new Error('E2E_SKIP');
  }
}

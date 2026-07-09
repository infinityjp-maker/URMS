import { beforeAll, describe, expect, it, vi } from 'vitest';

import { parseAppRoute } from './appRoute.js';

beforeAll(() => {
  vi.stubGlobal('window', {
    location: { pathname: '/', search: '', hash: '' },
  });
});

describe('module-nav', () => {
  it('maps screen prefixes to accents', async () => {
    const { moduleAccentForScreen } = await import('./module-nav.js');
    expect(moduleAccentForScreen('M-WEA-DET')).toBe('weather');
    expect(moduleAccentForScreen('M-CAL-MON')).toBe('calendar');
  });

  it('marks hub route active on dashboard', async () => {
    const { APP_NAV_ITEMS } = await import('./module-nav.js');
    const hubItem = APP_NAV_ITEMS.find((item) => item.id === 'hub');
    expect(hubItem?.isActive(parseAppRoute('#/'))).toBe(true);
    expect(hubItem?.isActive(parseAppRoute('#/M-WEA-DET'))).toBe(false);
  });
});

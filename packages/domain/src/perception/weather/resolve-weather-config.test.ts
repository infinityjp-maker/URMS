import { describe, expect, it, vi } from 'vitest';

import {
  pickPrimaryLocationLabel,
  resolvePrimaryLocationLabelForMode,
} from './resolve-weather-config.js';

describe('pickPrimaryLocationLabel', () => {
  it('prefers primary location resource name', () => {
    expect(
      pickPrimaryLocationLabel([
        { name: '副地点', metadata: { primary: false } },
        { name: '自宅', metadata: { primary: true } },
      ] as never[]),
    ).toBe('自宅');
  });

  it('falls back to first location when none is primary', () => {
    expect(pickPrimaryLocationLabel([{ name: 'オフィス', metadata: {} }] as never[])).toBe(
      'オフィス',
    );
  });
});

describe('resolvePrimaryLocationLabelForMode', () => {
  it('returns null when reader is unavailable', async () => {
    await expect(resolvePrimaryLocationLabelForMode(undefined, 'operate')).resolves.toBeNull();
  });

  it('reads active location resources through service reader', async () => {
    const reader = {
      list: vi.fn(async () => ({
        items: [{ name: '自宅', metadata: { primary: true } }],
      })),
    };

    await expect(resolvePrimaryLocationLabelForMode(reader, 'operate')).resolves.toBe('自宅');
  });
});

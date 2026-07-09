import { catalogHref, hubHref, screenHref } from './appRoute.js';
import type { AppRoute } from './appRoute.js';

export type ModuleAccent = 'weather' | 'calendar' | 'transport' | 'ops' | 'docs' | 'assets' | 'storage' | 'video';

export type ModuleLauncherItem = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly accent: ModuleAccent;
  readonly glyph: string;
};

export type AppNavItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly glyph: string;
  readonly isActive: (route: AppRoute) => boolean;
};

export const MODULE_LAUNCHER_ITEMS: readonly ModuleLauncherItem[] = [
  {
    id: 'M-WEA-DET',
    label: '天気',
    description: '詳細 · 傘 · 週間',
    href: screenHref('M-WEA-DET'),
    accent: 'weather',
    glyph: '☼',
  },
  {
    id: 'M-CAL-MON',
    label: 'カレンダー',
    description: '月表示 · 予定',
    href: screenHref('M-CAL-MON'),
    accent: 'calendar',
    glyph: '▦',
  },
  {
    id: 'M-TRN-DEP',
    label: '交通',
    description: '出発 · ルート',
    href: screenHref('M-TRN-DEP'),
    accent: 'transport',
    glyph: '→',
  },
  {
    id: 'M-OPS-LST',
    label: '運用',
    description: 'フロー · 監視',
    href: screenHref('M-OPS-LST'),
    accent: 'ops',
    glyph: '◎',
  },
  {
    id: 'M-AST-LST',
    label: '資産',
    description: '一覧 · PC',
    href: screenHref('M-AST-LST'),
    accent: 'assets',
    glyph: '◈',
  },
  {
    id: 'M-STR-LST',
    label: 'ストレージ',
    description: '容量 · 整理',
    href: screenHref('M-STR-LST'),
    accent: 'storage',
    glyph: '▤',
  },
  {
    id: 'M-VID-LST',
    label: '動画',
    description: 'ライブラリ',
    href: screenHref('M-VID-LST'),
    accent: 'video',
    glyph: '▶',
  },
  {
    id: 'M-DOC-VIEW',
    label: 'ドキュメント',
    description: 'URMS 手順',
    href: screenHref('M-DOC-VIEW'),
    accent: 'docs',
    glyph: '≡',
  },
] as const;

function isHub(route: AppRoute): boolean {
  return route.kind === 'dashboard' || (route.kind === 'screen' && route.screenId.startsWith('D-01'));
}

function screenPrefix(route: AppRoute, prefix: string): boolean {
  return route.kind === 'screen' && route.screenId.startsWith(prefix);
}

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  {
    id: 'hub',
    label: 'ハブ',
    href: hubHref(),
    glyph: '⌂',
    isActive: isHub,
  },
  {
    id: 'weather',
    label: '天気',
    href: screenHref('M-WEA-DET'),
    glyph: '☼',
    isActive: (route) => screenPrefix(route, 'M-WEA'),
  },
  {
    id: 'calendar',
    label: '予定',
    href: screenHref('M-CAL-MON'),
    glyph: '▦',
    isActive: (route) => screenPrefix(route, 'M-CAL'),
  },
  {
    id: 'transport',
    label: '交通',
    href: screenHref('M-TRN-DEP'),
    glyph: '→',
    isActive: (route) => screenPrefix(route, 'M-TRN'),
  },
  {
    id: 'catalog',
    label: '一覧',
    href: catalogHref(),
    glyph: '☰',
    isActive: (route) => route.kind === 'catalog',
  },
] as const;

export function moduleAccentForScreen(screenId: string): ModuleAccent | undefined {
  if (screenId.startsWith('M-WEA')) return 'weather';
  if (screenId.startsWith('M-CAL')) return 'calendar';
  if (screenId.startsWith('M-TRN')) return 'transport';
  if (screenId.startsWith('M-OPS')) return 'ops';
  if (screenId.startsWith('M-DOC')) return 'docs';
  if (screenId.startsWith('M-AST')) return 'assets';
  if (screenId.startsWith('M-STR')) return 'storage';
  if (screenId.startsWith('M-VID')) return 'video';
  return undefined;
}

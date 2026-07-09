export type ScreenStatus = 'live' | 'stub';

export type ProductScreen = {
  readonly id: string;
  readonly module: string;
  readonly moduleLabel: string;
  readonly name: string;
  readonly when: string;
  readonly note: string;
  readonly status: ScreenStatus;
};

/** v0.2 製品画面 SSOT — apps/desktop 正本 */
export const PRODUCT_SCREENS_V02: readonly ProductScreen[] = [
  {
    id: 'D-01',
    module: 'HUB',
    moduleLabel: 'ハブ',
    name: '知覚の窓（状況サマリー）',
    when: '起動直後 · 常時',
    note: '今必要な情報 + 各モジュールへの入口',
    status: 'live',
  },
  {
    id: 'M-WEA-DET',
    module: 'WEA',
    moduleLabel: '天気',
    name: '天気詳細 · 傘アドバイス',
    when: '天気カードをタップ',
    note: '時間別降水 · 週間（拡張予定） · 降水量ベース判断',
    status: 'live',
  },
  {
    id: 'M-WEA-WK',
    module: 'WEA',
    moduleLabel: '天気',
    name: '週間予報',
    when: '天気詳細から',
    note: '7 日間 · 降水トレンド · Open-Meteo',
    status: 'live',
  },
  {
    id: 'M-CAL-MON',
    module: 'CAL',
    moduleLabel: 'カレンダー',
    name: 'マンスリー',
    when: 'ハブ · カレンダー入口',
    note: '月移動 · 種別リードタイム · Google 連携',
    status: 'live',
  },
  {
    id: 'M-CAL-DET',
    module: 'CAL',
    moduleLabel: 'カレンダー',
    name: '予定詳細',
    when: '日付タップ',
    note: '種別別リードタイム · 交通連動 · eventId 深リンク',
    status: 'live',
  },
  {
    id: 'M-TRN-DEP',
    module: 'TRN',
    moduleLabel: '交通',
    name: '出発 · 駅発時刻',
    when: 'ハブ · 交通入口',
    note: '何分前に家を出るか · 余裕時間',
    status: 'live',
  },
  {
    id: 'M-TRN-ROUTE',
    module: 'TRN',
    moduleLabel: '交通',
    name: 'ルート · 到着予想',
    when: '外出予定連動',
    note: '乗換 · カレンダー連動',
    status: 'live',
  },
  {
    id: 'M-OPS-LST',
    module: 'OPS',
    moduleLabel: '運用',
    name: 'フロー一覧',
    when: 'ハブ · 運用入口',
    note: '正常 / 警告 / エラー色分け',
    status: 'live',
  },
  {
    id: 'M-OPS-DET',
    module: 'OPS',
    moduleLabel: '運用',
    name: 'フロー詳細',
    when: 'フロータップ',
    note: 'ログ · 次アクション',
    status: 'live',
  },
  {
    id: 'M-DOC-VIEW',
    module: 'DOC',
    moduleLabel: '知識',
    name: 'URMS ドキュメント',
    when: 'ハブ · ドキュメント入口',
    note: 'アプリ内閲覧 · 環境構築手順',
    status: 'live',
  },
  {
    id: 'M-AST-LST',
    module: 'AST',
    moduleLabel: '資産',
    name: '資産一覧',
    when: 'ハブ · 資産入口',
    note: '一覧 · カテゴリ · 予算サマリー',
    status: 'live',
  },
  {
    id: 'M-AST-PC',
    module: 'AST',
    moduleLabel: '資産',
    name: 'PC パーツ · ロードマップ',
    when: '資産詳細から',
    note: '価格推移 · 購入タイミング · ロードマップ',
    status: 'live',
  },
  {
    id: 'M-STR-LST',
    module: 'STR',
    moduleLabel: 'ストレージ',
    name: 'ストレージ一覧',
    when: 'ハブ · ストレージ入口',
    note: '容量 · 使用率 · 整理ヒント',
    status: 'live',
  },
  {
    id: 'M-STR-DET',
    module: 'STR',
    moduleLabel: 'ストレージ',
    name: 'ボリューム詳細',
    when: '一覧からタップ',
    note: '大きい項目 · 整理ヒント',
    status: 'live',
  },
  {
    id: 'M-VID-LST',
    module: 'VID',
    moduleLabel: '動画',
    name: '動画ライブラリ',
    when: 'ハブ · 動画入口',
    note: '一覧 · メタデータ · 保管方針',
    status: 'live',
  },
  {
    id: 'M-VID-DET',
    module: 'VID',
    moduleLabel: '動画',
    name: '動画詳細',
    when: 'ライブラリからタップ',
    note: 'タグ · コーデック · ストレージ連携',
    status: 'live',
  },
  {
    id: 'D-02',
    module: 'DEV',
    moduleLabel: '開発',
    name: '開発パネル',
    when: 'develop モード',
    note: 'Mode 切替で右パネル表示',
    status: 'live',
  },
] as const;

export function screenById(id: string): ProductScreen | undefined {
  return PRODUCT_SCREENS_V02.find((s) => s.id === id);
}

export function screensByModule(): Map<string, ProductScreen[]> {
  const map = new Map<string, ProductScreen[]>();
  for (const screen of PRODUCT_SCREENS_V02) {
    const list = map.get(screen.module) ?? [];
    list.push(screen);
    map.set(screen.module, list);
  }
  return map;
}

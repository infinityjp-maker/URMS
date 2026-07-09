export type UmbrellaLevel = 'none' | 'optional' | 'recommended' | 'required';

export type UmbrellaAdvice = {
  readonly level: UmbrellaLevel;
  readonly headline: string;
  readonly detail: string;
};

export type UmbrellaAdviceInput = {
  /** 現在または対象時間帯の降水確率 0–100 */
  readonly precipitationPct: number;
  /** 通勤/帰宅ウィンドウ内の最大降水確率 */
  readonly commuteWindowMaxPct?: number;
  /** 降水が続くおおよその分数（不明なら undefined） */
  readonly rainDurationMinutes?: number;
  /** カレンダー上の外出予定がある */
  readonly hasOutgoingPlan?: boolean;
};

/**
 * v0.2 — 降水量/確率と時間帯を主軸にした傘アドバイス（Domain 正本）
 */
export function adviseUmbrella(input: UmbrellaAdviceInput): UmbrellaAdvice {
  const peak = Math.max(input.precipitationPct, input.commuteWindowMaxPct ?? 0);
  const shortDrizzle = (input.rainDurationMinutes ?? 0) > 0 && (input.rainDurationMinutes ?? 0) <= 15;
  const commuteOverlap = peak >= 50 && (input.commuteWindowMaxPct ?? 0) >= 45;
  const outgoingSoon = input.hasOutgoingPlan === true && peak >= 35;

  if (peak < 20) {
    return {
      level: 'none',
      headline: '傘不要',
      detail: shortDrizzle
        ? 'にわか雨程度 · 袖やフードで十分な可能性'
        : '降水の心配は小さい · 折りたたみは任意',
    };
  }

  if (peak < 40 && !outgoingSoon) {
    return {
      level: 'optional',
      headline: '折りたたみ傘があると安心',
      detail: shortDrizzle
        ? '短時間の弱い降水 · 通勤時間外なら傘なしでも可'
        : '降水確率は中程度 · 外出前に再確認を',
    };
  }

  if (commuteOverlap || peak >= 60 || outgoingSoon) {
    return {
      level: 'required',
      headline: '傘必須',
      detail: commuteOverlap
        ? '通勤/帰宅時間帯に降水が集中 · 防水靴も検討'
        : outgoingSoon
          ? '外出予定前後に降水 · 出発 30 分前に再計算推奨'
          : '降水の可能性が高い · 長時間の外出は避けたい場合は要確認',
    };
  }

  return {
    level: 'recommended',
    headline: '傘を持っていくことを推奨',
    detail:
      (input.rainDurationMinutes ?? 0) > 30
        ? '30 分以上降水が続く見込み · 折りたたみ以上を'
        : '降水確率が上がり気味 · 帰宅まで持参を',
  };
}

/** Desktop — 月カレンダー用の全日付キー（Domain buildMonthDateKeys と同型） */
export function buildMonthDateKeys(year: number, month: number): string[] {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const keys: string[] = [];
  for (let day = 1; day <= lastDay; day += 1) {
    keys.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return keys;
}

export function weekdayIndexForDateKey(dateKey: string, timeZone: string): number {
  const anchor =
    timeZone === 'Asia/Tokyo'
      ? new Date(`${dateKey}T12:00:00+09:00`)
      : new Date(`${dateKey}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(anchor);
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Math.max(0, labels.indexOf(weekday));
}

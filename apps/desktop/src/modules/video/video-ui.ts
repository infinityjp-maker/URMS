function kindLabel(kind: string): string {
  if (kind === 'raw') return 'raw 素材';
  if (kind === 'export') return 'export';
  if (kind === 'project') return 'プロジェクト';
  if (kind === 'archive') return 'アーカイブ';
  return kind;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} 時間 ${rest} 分` : `${hours} 時間`;
}

function formatGb(value: number): string {
  return `${value.toLocaleString('ja-JP')} GB`;
}

export { kindLabel, formatDuration, formatGb };

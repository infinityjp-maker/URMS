function kindLabel(kind: string): string {
  if (kind === 'system') return 'システム';
  if (kind === 'data') return 'データ';
  if (kind === 'archive') return 'アーカイブ';
  if (kind === 'external') return '外付け';
  return kind;
}

function usageClass(usagePct: number): string {
  if (usagePct >= 85) return 'storage-usage storage-usage--critical';
  if (usagePct >= 70) return 'storage-usage storage-usage--warn';
  return 'storage-usage';
}

function formatGb(value: number): string {
  return `${value.toLocaleString('ja-JP')} GB`;
}

export { kindLabel, usageClass, formatGb };

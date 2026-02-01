type Props = {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  accent?: string;
};

export default function Sparkline({ data, width = 140, height = 34, strokeWidth = 2, accent = "#7c3aed" }: Props) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / Math.max(1, data.length - 1);
  const points = data.map((d, i) => `${i * step},${height - ((d - min) / range) * height}`).join(" ");
  const d = `M ${points}`;

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <path d={d} fill="none" stroke={accent} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

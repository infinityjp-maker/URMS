export function LoadingState({ label = '読み込み中…' }: { label?: string }) {
  return (
    <div className="state-box" role="status" aria-live="polite">
      <p>{label}</p>
    </div>
  );
}

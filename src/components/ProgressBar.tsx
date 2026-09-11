export default function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
      <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

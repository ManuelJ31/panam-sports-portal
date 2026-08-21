export default function KpiTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: number | string;
  caption: string;
}) {
  return (
    <div className="rounded-xl border border-paper-line bg-paper p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 font-display text-3xl font-semibold text-navy">{value}</p>
      <p className="mt-0.5 text-xs text-navy-faint">{caption}</p>
    </div>
  );
}

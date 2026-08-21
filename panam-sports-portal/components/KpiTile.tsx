export default function KpiTile({
  label,
  value,
  caption,
  onClick,
  active,
}: {
  label: string;
  value: number | string;
  caption: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const className = `rounded-xl border p-4 text-left transition-colors ${
    active ? "border-blue bg-blue-soft" : "border-paper-line bg-paper"
  } ${onClick ? "cursor-pointer hover:border-blue" : ""}`;

  const content = (
    <>
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 font-display text-3xl font-semibold text-navy">{value}</p>
      <p className="mt-0.5 text-xs text-navy-faint">{caption}</p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} w-full`}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

import Link from "next/link";
import type { MethodologistReport, Noc } from "@/lib/types";
import { formatWeekLabel } from "@/lib/format";

export default function GroupCard({
  label,
  slug,
  summaries,
}: {
  label: string;
  slug: string;
  summaries: { noc: Noc; latestReport: MethodologistReport | undefined }[];
}) {
  const latest = summaries
    .map((s) => s.latestReport)
    .filter((r): r is MethodologistReport => Boolean(r))
    .sort((a, b) => a.year - b.year || a.weekNumber - b.weekNumber)
    .pop();

  return (
    <div className="group relative flex flex-col rounded-2xl border border-paper-line bg-paper p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cardHover">
      <p className="eyebrow">Methodologist Program</p>
      <h3 className="mt-1 font-display text-2xl leading-tight text-navy">{label}</h3>

      <div className="mt-5 flex min-h-8 flex-wrap items-center gap-2">
        {summaries.map(({ noc }) => (
          <span
            key={noc.code}
            title={noc.name}
            className={`fi fi-${noc.flagCode} rounded text-3xl leading-none shadow-sm`}
            aria-label={noc.name}
          />
        ))}
      </div>

      <div className="mt-6 border-t border-paper-line pt-4">
        <p className="text-xs text-navy-faint">
          {summaries.length === 0
            ? "No committees assigned yet"
            : `${summaries.length} ${summaries.length === 1 ? "committee" : "committees"}`}
        </p>
        <p className="mt-0.5 font-meta text-sm text-navy-soft">
          {latest
            ? `Latest available week: ${formatWeekLabel(latest.weekNumber, latest.year)}`
            : "No reports submitted yet"}
        </p>
      </div>

      <Link
        href={`/${slug}`}
        className="mt-5 flex items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-blue-dim"
      >
        Open {label}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      </Link>
    </div>
  );
}

import Link from "next/link";
import type { MethodologistReport, Noc } from "@/lib/types";
import { formatWeekLabel } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import WeekRing from "@/components/WeekRing";

export default function CountryCard({
  noc,
  latestReport,
}: {
  noc: Noc;
  latestReport: MethodologistReport | undefined;
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-paper-line bg-paper p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cardHover">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <span
            className={`fi fi-${noc.flagCode} rounded text-4xl leading-none shadow-sm`}
            aria-hidden
          />
          <div>
            <h3 className="font-display text-xl leading-tight text-navy">
              {noc.name}
            </h3>
            <p className="eyebrow mt-1">{noc.region}</p>
          </div>
        </div>
        {latestReport && <WeekRing weekNumber={latestReport.weekNumber} />}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-paper-line pt-4">
        {latestReport ? (
          <>
            <div>
              <p className="text-xs text-navy-faint">Latest available week</p>
              <p className="mt-0.5 font-meta text-sm text-navy-soft">
                {formatWeekLabel(latestReport.weekNumber, latestReport.year)}
              </p>
            </div>
            <StatusBadge status={latestReport.status} />
          </>
        ) : (
          <p className="text-sm text-navy-faint">No reports submitted yet</p>
        )}
      </div>

      <Link
        href={latestReport ? `/report/${latestReport.id}` : "#"}
        aria-disabled={!latestReport}
        className={`mt-5 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
          latestReport
            ? "bg-navy text-paper hover:bg-blue-dim"
            : "pointer-events-none bg-paper-off text-navy-faint"
        }`}
      >
        Open Report
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      </Link>
    </div>
  );
}

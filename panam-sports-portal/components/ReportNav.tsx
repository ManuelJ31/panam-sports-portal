import Link from "next/link";
import type { MethodologistReport } from "@/lib/types";
import { formatWeekLabel } from "@/lib/format";

function NavLink({
  report,
  direction,
}: {
  report: MethodologistReport | undefined;
  direction: "previous" | "next";
}) {
  const isPrevious = direction === "previous";
  const base =
    "flex flex-1 flex-col gap-1 rounded-xl border border-paper-line px-5 py-4 transition-colors";

  if (!report) {
    return (
      <div className={`${base} cursor-not-allowed bg-paper-off text-navy-faint ${isPrevious ? "items-start" : "items-end"}`}>
        <span className="eyebrow">{isPrevious ? "Previous Week" : "Next Week"}</span>
        <span className="text-sm">Not available</span>
      </div>
    );
  }

  return (
    <Link
      href={`/report/${report.id}`}
      className={`${base} hover:border-blue hover:bg-blue-soft ${isPrevious ? "items-start text-left" : "items-end text-right"}`}
    >
      <span className="eyebrow flex items-center gap-1.5">
        {isPrevious && <span aria-hidden>&larr;</span>}
        {isPrevious ? "Previous Week" : "Next Week"}
        {!isPrevious && <span aria-hidden>&rarr;</span>}
      </span>
      <span className="font-meta text-sm text-navy">
        {formatWeekLabel(report.weekNumber, report.year)}
      </span>
    </Link>
  );
}

export default function ReportNav({
  previous,
  next,
}: {
  previous: MethodologistReport | undefined;
  next: MethodologistReport | undefined;
}) {
  return (
    <nav aria-label="Week navigation" className="mt-4 flex gap-4">
      <NavLink report={previous} direction="previous" />
      <NavLink report={next} direction="next" />
    </nav>
  );
}

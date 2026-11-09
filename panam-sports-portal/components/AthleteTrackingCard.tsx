import Link from "next/link";

export default function AthleteTrackingCard({
  athletes,
  sports,
  committees,
}: {
  athletes: number;
  sports: number;
  committees: number;
}) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-paper-line bg-paper p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cardHover">
      <p className="eyebrow">Sports</p>
      <h3 className="mt-1 font-display text-2xl leading-tight text-navy">Athlete Tracking</h3>
      <p className="mt-5 text-sm leading-relaxed text-navy-soft">
        Prioritized athletes and their competition results, by committee and sport.
      </p>

      <div className="mt-auto pt-6">
        <div className="border-t border-paper-line pt-4">
          <p className="text-xs text-navy-faint">
            {committees} {committees === 1 ? "committee" : "committees"}
          </p>
          <p className="mt-0.5 font-meta text-sm text-navy-soft">
            {athletes} {athletes === 1 ? "athlete" : "athletes"} &middot; {sports}{" "}
            {sports === 1 ? "sport" : "sports"}
          </p>
        </div>

        <Link
          href="/athletes"
          className="mt-5 flex items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-blue-dim"
        >
          Open Athlete Tracking
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}

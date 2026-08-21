import type { ReportInitiative } from "@/lib/types";
import Tag, { type Tone } from "@/components/Tag";

const STATUS_TONE: Record<string, Tone> = {
  "In Progress": "blue",
  Completed: "green",
  "On Hold": "gold",
  Delayed: "red",
  Cancelled: "gray",
};

function Trend({
  current,
  previous,
}: {
  current: number;
  previous: number | null;
}) {
  if (previous === null) {
    return <span className="text-xs text-navy-faint">First week tracked</span>;
  }

  const delta = current - previous;
  if (delta === 0) {
    return <span className="text-xs font-medium text-navy-faint">No change vs. last week</span>;
  }

  const isUp = delta > 0;
  return (
    <span
      className={`text-xs font-medium ${isUp ? "text-status-approved" : "text-status-returned"}`}
    >
      {isUp ? "▲" : "▼"} {Math.abs(delta)} vs. last week
    </span>
  );
}

export default function InitiativesProgress({
  initiatives,
}: {
  initiatives: ReportInitiative[];
}) {
  if (initiatives.length === 0) return null;

  return (
    <section className="border-t border-paper-line py-8 first:border-t-0 first:pt-0">
      <h2 className="eyebrow">Initiative Progress</h2>
      <div className="mt-4 flex flex-col gap-4">
        {initiatives.map((ini, i) => (
          <div key={i} className="rounded-xl border border-paper-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-base font-medium text-navy">{ini.name}</p>
                {ini.category && <p className="eyebrow mt-0.5">{ini.category}</p>}
              </div>
              <Tag label={ini.status} tone={STATUS_TONE[ini.status] ?? "gray"} />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-line">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${ini.weeklyProgress * 10}%` }}
                />
              </div>
              <span className="font-meta text-sm text-navy-soft">{ini.weeklyProgress}/10</span>
            </div>
            <div className="mt-1.5">
              <Trend current={ini.weeklyProgress} previous={ini.previousWeeklyProgress} />
            </div>

            {ini.briefUpdate && (
              <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-navy-soft">
                {ini.briefUpdate}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

import type { ReportChallenge } from "@/lib/types";
import Tag, { type Tone } from "@/components/Tag";

const PRIORITY_TONE: Record<string, Tone> = {
  Low: "gray",
  Medium: "gold",
  High: "red",
};

const STATUS_TONE: Record<string, Tone> = {
  Addressed: "green",
  "In Progress": "blue",
  "Pending Follow-up": "gold",
};

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

export default function ReportChallenges({ challenges }: { challenges: ReportChallenge[] }) {
  if (challenges.length === 0) return null;

  const sorted = [...challenges].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99),
  );

  return (
    <section className="border-t border-paper-line py-8 first:border-t-0 first:pt-0">
      <h2 className="eyebrow">Challenges</h2>
      <div className="mt-4 flex flex-col gap-4">
        {sorted.map((c, i) => (
          <div key={i} className="rounded-xl border border-paper-line p-4">
            <div className="flex flex-wrap items-center gap-2">
              {c.priority && (
                <Tag
                  label={`${c.priority} priority`}
                  tone={PRIORITY_TONE[c.priority] ?? "gray"}
                />
              )}
              {c.status && <Tag label={c.status} tone={STATUS_TONE[c.status] ?? "gray"} />}
              {c.category && <span className="eyebrow">{c.category}</span>}
            </div>
            <p className="mt-2.5 max-w-prose text-[15px] leading-relaxed text-navy">
              {c.description}
            </p>
            {c.actionNeeded && (
              <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-navy-soft">
                <span className="font-medium text-navy-faint">Action — </span>
                {c.actionNeeded}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

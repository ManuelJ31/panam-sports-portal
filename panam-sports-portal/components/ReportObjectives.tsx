import type { ReportObjective } from "@/lib/types";

export default function ReportObjectives({ objectives }: { objectives: ReportObjective[] }) {
  if (objectives.length === 0) return null;

  return (
    <section className="border-t border-paper-line py-8 first:border-t-0 first:pt-0">
      <h2 className="eyebrow">This Week&rsquo;s Objectives</h2>
      <ol className="mt-4 flex flex-col gap-5">
        {objectives.map((o) => (
          <li key={o.priority} className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-soft font-meta text-xs font-semibold text-blue-dim">
              {o.priority}
            </span>
            <div className="flex flex-col gap-1.5 pt-0.5">
              <p className="max-w-prose text-[17px] leading-[1.6] text-navy">{o.objective}</p>
              <p className="max-w-prose text-sm leading-relaxed text-navy-soft">
                <span className="font-medium text-navy-faint">Expected result — </span>
                {o.expectedResult}
              </p>
              <p className="max-w-prose text-sm leading-relaxed text-navy-soft">
                <span className="font-medium text-navy-faint">Success indicator — </span>
                {o.successIndicator}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

import { Fragment } from "react";
import type { ReportStakeholderEngagement } from "@/lib/types";
import StakeholderLevelChart from "@/components/StakeholderLevelChart";

const LEVEL_ORDER = ["Executive", "Institutional", "Field", "Other"];

export default function StakeholderOverview({
  engagements,
  expandedType,
  onToggleType,
}: {
  engagements: ReportStakeholderEngagement[];
  expandedType: string | null;
  onToggleType: (type: string) => void;
}) {
  if (engagements.length === 0) return null;

  const byLevel = new Map<string, number>();
  const byType = new Map<string, ReportStakeholderEngagement[]>();
  for (const e of engagements) {
    if (e.level) byLevel.set(e.level, (byLevel.get(e.level) ?? 0) + 1);
    if (e.type) byType.set(e.type, [...(byType.get(e.type) ?? []), e]);
  }

  const levelData = LEVEL_ORDER.filter((level) => byLevel.has(level)).map((level) => ({
    level,
    count: byLevel.get(level) as number,
  }));
  const typeData = [...byType.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="eyebrow">Engagement by Level</p>
          <div className="mt-3">
            <StakeholderLevelChart data={levelData} />
          </div>
        </div>
        <div>
          <p className="eyebrow">Stakeholders by Type</p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {typeData.map(([type, people]) => {
                const isOpen = expandedType === type;
                return (
                  <Fragment key={type}>
                    <tr
                      onClick={() => onToggleType(type)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onToggleType(type);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer border-b border-paper-line/60 transition-colors last:border-0 hover:bg-paper-off"
                      aria-expanded={isOpen}
                    >
                      <td className="py-1.5 pr-3 text-navy-soft">
                        <span
                          aria-hidden
                          className={`mr-1.5 inline-block text-navy-faint transition-transform ${isOpen ? "rotate-90" : ""}`}
                        >
                          &rsaquo;
                        </span>
                        {type}
                      </td>
                      <td className="py-1.5 text-right font-meta text-navy">{people.length}</td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-paper-line/60 last:border-0">
                        <td colSpan={2} className="bg-paper-off px-3 py-3">
                          <ul className="flex flex-col gap-1.5">
                            {people.map((p, i) => (
                              <li key={i} className="text-xs leading-relaxed text-navy-soft">
                                <span className="font-medium text-navy">{p.name}</span>
                                {p.role && ` — ${p.role}`}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-4 text-xs text-navy-faint">
        {engagements.length} total engagement{engagements.length === 1 ? "" : "s"} this week,
        across {byType.size} stakeholder type{byType.size === 1 ? "" : "s"}.
      </p>
    </div>
  );
}

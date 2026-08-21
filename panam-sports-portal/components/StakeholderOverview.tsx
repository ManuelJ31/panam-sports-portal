import type { ReportStakeholderEngagement } from "@/lib/types";
import StakeholderLevelChart from "@/components/StakeholderLevelChart";

const LEVEL_ORDER = ["Executive", "Institutional", "Field", "Other"];

export default function StakeholderOverview({
  engagements,
}: {
  engagements: ReportStakeholderEngagement[];
}) {
  if (engagements.length === 0) return null;

  const byLevel = new Map<string, number>();
  const byType = new Map<string, number>();
  for (const e of engagements) {
    if (e.level) byLevel.set(e.level, (byLevel.get(e.level) ?? 0) + 1);
    if (e.type) byType.set(e.type, (byType.get(e.type) ?? 0) + 1);
  }

  const levelData = LEVEL_ORDER.filter((level) => byLevel.has(level)).map((level) => ({
    level,
    count: byLevel.get(level) as number,
  }));
  const typeData = [...byType.entries()].sort((a, b) => b[1] - a[1]);

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
              {typeData.map(([type, count]) => (
                <tr key={type} className="border-b border-paper-line/60 last:border-0">
                  <td className="py-1.5 pr-3 text-navy-soft">{type}</td>
                  <td className="py-1.5 text-right font-meta text-navy">{count}</td>
                </tr>
              ))}
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

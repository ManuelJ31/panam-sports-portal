import type { MethodologistReport } from "@/lib/types";
import KpiTile from "@/components/KpiTile";
import InitiativesTable from "@/components/InitiativesTable";
import WeeklyTrendChart from "@/components/WeeklyTrendChart";

export default function WeeklyDashboard({
  report,
  trend,
}: {
  report: MethodologistReport;
  trend: { week: string; avgProgress: number }[];
}) {
  const openChallenges = report.challenges.filter((c) => c.status !== "Addressed").length;

  return (
    <div className="animate-fadeUp rounded-2xl border border-paper-line bg-paper p-6 shadow-card sm:p-8">
      <div className="grid grid-cols-2 gap-4">
        <KpiTile
          label="Strategic Initiatives"
          value={report.initiatives.length}
          caption="Tracked this week"
        />
        <KpiTile label="Support Needs" value={openChallenges} caption="Open items" />
      </div>

      {report.initiatives.length > 0 && (
        <div className="mt-8">
          <h2 className="eyebrow">Initiative Progress &amp; Trend</h2>
          <div className="mt-3">
            <InitiativesTable initiatives={report.initiatives} />
          </div>
        </div>
      )}

      {trend.length >= 2 && (
        <div className="mt-8">
          <h2 className="eyebrow">Weekly Progress Trend (All Initiatives)</h2>
          <div className="mt-3">
            <WeeklyTrendChart data={trend} />
          </div>
        </div>
      )}
    </div>
  );
}

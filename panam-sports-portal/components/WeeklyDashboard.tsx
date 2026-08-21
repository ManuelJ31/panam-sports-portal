import type { MethodologistReport } from "@/lib/types";
import KpiTile from "@/components/KpiTile";
import InitiativesTable from "@/components/InitiativesTable";
import KeyActivitiesTable from "@/components/KeyActivitiesTable";
import StakeholderOverview from "@/components/StakeholderOverview";
import WeeklyTrendChart from "@/components/WeeklyTrendChart";

export default function WeeklyDashboard({
  report,
  trend,
}: {
  report: MethodologistReport;
  trend: { week: string; avgProgress: number }[];
}) {
  const openChallenges = report.challenges.filter((c) => c.status !== "Addressed").length;
  const completedActivities = report.activities.filter((a) => a.status === "Completed").length;

  return (
    <div className="animate-fadeUp rounded-2xl border border-paper-line bg-paper p-6 shadow-card sm:p-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiTile
          label="Activities Completed"
          value={completedActivities}
          caption={`of ${report.activities.length} logged this week`}
        />
        <KpiTile
          label="Strategic Initiatives"
          value={report.initiatives.length}
          caption="Tracked this week"
        />
        <KpiTile
          label="Stakeholder Engagements"
          value={report.stakeholderEngagements.length}
          caption="This week"
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

      {report.activities.length > 0 && (
        <div className="mt-8">
          <h2 className="eyebrow">Key Activities This Week</h2>
          <div className="mt-3">
            <KeyActivitiesTable activities={report.activities} />
          </div>
        </div>
      )}

      {report.stakeholderEngagements.length > 0 && (
        <div className="mt-8">
          <h2 className="eyebrow">Stakeholder Engagement Overview</h2>
          <div className="mt-3">
            <StakeholderOverview engagements={report.stakeholderEngagements} />
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

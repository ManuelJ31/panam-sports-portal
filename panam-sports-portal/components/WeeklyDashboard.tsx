"use client";

import { useRef, useState } from "react";
import { CheckCircle2, LineChart, ListChecks, Target, Users, LifeBuoy } from "lucide-react";
import type { MethodologistReport } from "@/lib/types";
import KpiTile from "@/components/KpiTile";
import InitiativesTable from "@/components/InitiativesTable";
import KeyActivitiesTable from "@/components/KeyActivitiesTable";
import StakeholderOverview from "@/components/StakeholderOverview";
import WeeklyTrendChart from "@/components/WeeklyTrendChart";

export default function WeeklyDashboard({
  report,
  trend,
  initiativeHistories,
}: {
  report: MethodologistReport;
  trend: { week: string; avgProgress: number; period: string | null }[];
  initiativeHistories: Record<string, { week: string; progress: number }[]>;
}) {
  const [expandedInitiativeId, setExpandedInitiativeId] = useState<string | null>(null);
  const [highlightCompleted, setHighlightCompleted] = useState(false);
  const [expandedStakeholderType, setExpandedStakeholderType] = useState<string | null>(null);
  const activitiesRef = useRef<HTMLDivElement>(null);

  const openChallenges = report.challenges.filter((c) => c.status !== "Addressed").length;
  const completedActivities = report.activities.filter((a) => a.status === "Completed").length;

  return (
    <div className="animate-fadeUp rounded-2xl border border-paper-line bg-paper p-6 shadow-card sm:p-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiTile
          label="Activities Completed"
          value={completedActivities}
          caption={`of ${report.activities.length} logged this week`}
          icon={CheckCircle2}
          active={highlightCompleted}
          onClick={
            report.activities.length > 0
              ? () => {
                  setHighlightCompleted((v) => !v);
                  activitiesRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              : undefined
          }
        />
        <KpiTile
          label="Strategic Initiatives"
          value={report.initiatives.length}
          caption="Tracked this week"
          icon={Target}
        />
        <KpiTile
          label="Stakeholder Engagements"
          value={report.stakeholderEngagements.length}
          caption="This week"
          icon={Users}
        />
        <KpiTile
          label="Support Needs"
          value={openChallenges}
          caption="Open items"
          icon={LifeBuoy}
        />
      </div>

      {report.initiatives.length > 0 && (
        <div className="mt-8">
          <h2 className="eyebrow flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-navy-faint" strokeWidth={2} aria-hidden />
            Initiative Progress &amp; Trend
          </h2>
          <p className="mt-1 text-xs text-navy-faint print:hidden">
            Click a row for its full update and history.
          </p>
          <div className="mt-3">
            <InitiativesTable
              initiatives={report.initiatives}
              histories={initiativeHistories}
              expandedId={expandedInitiativeId}
              onToggle={(id) =>
                setExpandedInitiativeId((current) => (current === id ? null : id))
              }
            />
          </div>
        </div>
      )}

      {report.activities.length > 0 && (
        <div ref={activitiesRef} className="mt-8 scroll-mt-6">
          <h2 className="eyebrow flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-navy-faint" strokeWidth={2} aria-hidden />
            Key Activities This Week
          </h2>
          <div className="mt-3">
            <KeyActivitiesTable
              activities={report.activities}
              highlightCompleted={highlightCompleted}
            />
          </div>
        </div>
      )}

      {report.stakeholderEngagements.length > 0 && (
        <div className="mt-8">
          <h2 className="eyebrow flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-navy-faint" strokeWidth={2} aria-hidden />
            Stakeholder Engagement Overview
          </h2>
          <p className="mt-1 text-xs text-navy-faint print:hidden">
            Click a type for who was engaged.
          </p>
          <div className="mt-3">
            <StakeholderOverview
              engagements={report.stakeholderEngagements}
              expandedType={expandedStakeholderType}
              onToggleType={(type) =>
                setExpandedStakeholderType((current) => (current === type ? null : type))
              }
            />
          </div>
        </div>
      )}

      {trend.length >= 2 && (
        <div className="mt-8">
          <h2 className="eyebrow flex items-center gap-1.5">
            <LineChart className="h-3.5 w-3.5 text-navy-faint" strokeWidth={2} aria-hidden />
            Weekly Progress Trend (All Initiatives)
          </h2>
          <div className="mt-3">
            <WeeklyTrendChart data={trend} />
          </div>
        </div>
      )}
    </div>
  );
}

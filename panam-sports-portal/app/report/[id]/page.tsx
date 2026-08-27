import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAdjacentReports,
  getAllReports,
  getInitiativeHistory,
  getInitiativeTrend,
  getNoc,
  getReport,
} from "@/lib/reports";
import DossierHeader from "@/components/DossierHeader";
import ReportSection from "@/components/ReportSection";
import ReportNav from "@/components/ReportNav";
import WeeklyDashboard from "@/components/WeeklyDashboard";
import ReportObjectives from "@/components/ReportObjectives";
import InitiativesProgress from "@/components/InitiativesProgress";
import ReportChallenges from "@/components/ReportChallenges";

export function generateStaticParams() {
  return getAllReports().map((report) => ({ id: report.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = getReport(id);
  const noc = report ? getNoc(report.nocCode) : undefined;
  if (!report || !noc) return { title: "Report not found" };

  return {
    title: `${noc.name} — ${report.week} ${report.year} · Panam Sports Executive Monitoring Platform`,
    description: report.executiveSummary,
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = getReport(id);
  const noc = report ? getNoc(report.nocCode) : undefined;

  if (!report || !noc) notFound();

  const { previous, next } = getAdjacentReports(report.id);
  const trend = getInitiativeTrend(report.nocCode, report.id);
  const initiativeHistories = Object.fromEntries(
    report.initiatives.map((ini) => [
      ini.id,
      getInitiativeHistory(report.nocCode, ini.id, report.id),
    ])
  );

  return (
    <main className="mx-auto w-full max-w-canvas flex-1 px-6 pb-24 pt-10 print:pb-4 print:pt-0 sm:px-10 sm:pt-14">
      <Link
        href="/"
        className="eyebrow inline-flex items-center gap-1.5 text-navy-faint transition-colors hover:text-blue-dim print:hidden"
      >
        <span aria-hidden>&larr;</span> All Committees
      </Link>

      <div className="mt-8">
        <DossierHeader noc={noc} report={report} />
      </div>

      <div className="mt-12">
        <WeeklyDashboard
          report={report}
          trend={trend}
          initiativeHistories={initiativeHistories}
        />
      </div>

      <div className="mt-4 flex justify-end print:hidden">
        <a
          href={report.dashboardPdf}
          download
          className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-blue-dim"
        >
          Download PDF
          <span aria-hidden>&darr;</span>
        </a>
      </div>

      <div className="mt-6">
        <ReportObjectives objectives={report.objectives} />
        <ReportSection label="Executive Summary">
          {report.executiveSummary}
        </ReportSection>
        <InitiativesProgress initiatives={report.initiatives} />
        <ReportSection label="Panam Sports Support Needed">
          {report.supportNeeded}
        </ReportSection>
        <ReportChallenges challenges={report.challenges} />
        <ReportSection label="Next Week Focus">
          {report.nextWeekFocus}
        </ReportSection>
      </div>

      <div className="print:hidden">
        <ReportNav previous={previous} next={next} />
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAdjacentReports,
  getAllReports,
  getNoc,
  getReport,
} from "@/lib/reports";
import DossierHeader from "@/components/DossierHeader";
import ReportSection from "@/components/ReportSection";
import ReportNav from "@/components/ReportNav";
import DashboardImage from "@/components/DashboardImage";

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
    title: `${noc.name} — ${report.week} ${report.year} · Panam Sports Monitoring Portal`,
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

  return (
    <main className="mx-auto min-h-screen max-w-canvas px-6 pb-24 pt-10 sm:px-10 sm:pt-14">
      <Link
        href="/"
        className="eyebrow inline-flex items-center gap-1.5 text-navy-faint transition-colors hover:text-blue-dim"
      >
        <span aria-hidden>&larr;</span> All Committees
      </Link>

      <div className="mt-8">
        <DossierHeader noc={noc} report={report} />
      </div>

      <figure className="mt-12 animate-fadeUp overflow-hidden rounded-2xl border border-paper-line bg-paper-off shadow-card">
        <DashboardImage
          src={report.dashboardImage}
          alt={`Weekly monitoring dashboard for ${noc.name}, ${report.week} ${report.year}`}
        />
      </figure>

      <div className="mt-4 flex justify-end">
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
        <ReportSection label="Executive Summary">
          {report.executiveSummary}
        </ReportSection>
        <ReportSection label="Panam Sports Support Needed">
          {report.supportNeeded}
        </ReportSection>
        <ReportSection label="Next Week Focus">
          {report.nextWeekFocus}
        </ReportSection>
      </div>

      <ReportNav previous={previous} next={next} />
    </main>
  );
}

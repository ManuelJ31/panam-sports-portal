import reportsData from "@/data/reports.json";
import type { MethodologistReport, Noc, ReportsData } from "@/lib/types";
import { formatWeekPeriod } from "@/lib/format";

const data = reportsData as ReportsData;

/**
 * All data access for the portal flows through this module.
 * Swapping the underlying source (e.g. a CMS or database) later
 * only requires changing the implementations below — every
 * consuming component keeps working unchanged.
 */

export function getAllNocs(): Noc[] {
  return [...data.nocs].sort((a, b) => a.name.localeCompare(b.name));
}

export function getNoc(code: string): Noc | undefined {
  return data.nocs.find((n) => n.code === code);
}

export function getAllReports(): MethodologistReport[] {
  return data.reports;
}

export function getReport(id: string): MethodologistReport | undefined {
  return data.reports.find((r) => r.id === id);
}

export function getReportsForNoc(nocCode: string): MethodologistReport[] {
  return data.reports
    .filter((r) => r.nocCode === nocCode)
    .sort((a, b) => a.year - b.year || a.weekNumber - b.weekNumber);
}

/** Most recent report available for a given NOC, or undefined if none exist. */
export function getLatestReportForNoc(
  nocCode: string
): MethodologistReport | undefined {
  const reports = getReportsForNoc(nocCode);
  return reports[reports.length - 1];
}

/**
 * One card per NOC, paired with its latest report (if any).
 * NOCs without a submitted report yet are still returned, so the
 * home page can render an empty state instead of silently omitting them.
 */
export function getNocSummaries(): {
  noc: Noc;
  latestReport: MethodologistReport | undefined;
}[] {
  return getAllNocs().map((noc) => ({
    noc,
    latestReport: getLatestReportForNoc(noc.code),
  }));
}

/** Chronological neighbors of a report, for Previous/Next Week navigation. */
export function getAdjacentReports(id: string): {
  previous: MethodologistReport | undefined;
  next: MethodologistReport | undefined;
} {
  const report = getReport(id);
  if (!report) return { previous: undefined, next: undefined };

  const timeline = getReportsForNoc(report.nocCode);
  const index = timeline.findIndex((r) => r.id === id);

  return {
    previous: index > 0 ? timeline[index - 1] : undefined,
    next: index >= 0 && index < timeline.length - 1 ? timeline[index + 1] : undefined,
  };
}

/**
 * Week-by-week average initiative progress (0-10) for a NOC, up to and
 * including the given report. Weeks with no initiatives tracked are
 * skipped rather than plotted as zero.
 */
export function getInitiativeTrend(
  nocCode: string,
  uptoReportId: string
): { week: string; avgProgress: number; period: string | null }[] {
  const timeline = getReportsForNoc(nocCode);
  const uptoIndex = timeline.findIndex((r) => r.id === uptoReportId);
  const relevant = uptoIndex >= 0 ? timeline.slice(0, uptoIndex + 1) : timeline;

  return relevant
    .filter((r) => r.initiatives.length > 0)
    .map((r) => ({
      week: r.week,
      avgProgress:
        Math.round(
          (r.initiatives.reduce((sum, i) => sum + i.weeklyProgress, 0) /
            r.initiatives.length) *
            10
        ) / 10,
      period:
        r.weekStartDate && r.weekEndDate
          ? formatWeekPeriod(r.weekStartDate, r.weekEndDate)
          : null,
    }));
}

/**
 * Week-by-week checkpoints for a single standing initiative, up to and
 * including the given report.
 */
export function getInitiativeHistory(
  nocCode: string,
  initiativeId: string,
  uptoReportId: string
): { week: string; progress: number }[] {
  const timeline = getReportsForNoc(nocCode);
  const uptoIndex = timeline.findIndex((r) => r.id === uptoReportId);
  const relevant = uptoIndex >= 0 ? timeline.slice(0, uptoIndex + 1) : timeline;

  const history: { week: string; progress: number }[] = [];
  for (const r of relevant) {
    const match = r.initiatives.find((i) => i.id === initiativeId);
    if (match) history.push({ week: r.week, progress: match.weeklyProgress });
  }
  return history;
}

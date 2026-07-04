import reportsData from "@/data/reports.json";
import type { MethodologistReport, Noc, ReportsData } from "@/lib/types";

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

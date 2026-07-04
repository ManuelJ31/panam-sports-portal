export type ReportStatus = "Draft" | "Submitted" | "Reviewed" | "Approved" | "Returned";

export interface Noc {
  /** IOC/Panam Sports 3-letter country code, e.g. "DMA" */
  code: string;
  /** Official country name, e.g. "Dominica" */
  name: string;
  /** Region grouping, e.g. "Caribbean" */
  region: string;
  /** ISO 3166-1 alpha-2 code (lowercase), used as the flag-icons class suffix, e.g. "bz" */
  flagCode: string;
}

export interface MethodologistReport {
  /** Canonical report id, matches asset file names: PS-<NOC>-<YEAR>-W<WEEK> */
  id: string;
  nocCode: string;
  year: number;
  /** Zero-padded week string, e.g. "W06" */
  week: string;
  /** Numeric week for sorting/comparison, e.g. 6 */
  weekNumber: number;
  methodologist: string;
  submissionDate: string;
  status: ReportStatus;
  dashboardImage: string;
  dashboardPdf: string;
  executiveSummary: string;
  supportNeeded: string;
  nextWeekFocus: string;
}

export interface ReportsData {
  nocs: Noc[];
  reports: MethodologistReport[];
}

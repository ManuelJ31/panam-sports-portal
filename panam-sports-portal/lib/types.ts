export type ReportStatus = "Draft" | "Submitted" | "Reviewed" | "Approved" | "Returned";

export interface Noc {
  /** IOC/Panam Sports 3-letter country code, e.g. "DMA" */
  code: string;
  /** Official country name, e.g. "Dominica" */
  name: string;
  /** NOC group from the source workbook's dimNOCGroup, e.g. "Group1" */
  nocGroup: string;
  /** ISO 3166-1 alpha-2 code (lowercase), used as the flag-icons class suffix, e.g. "bz" */
  flagCode: string;
}

/** One numbered objective the methodologist is working toward that week. */
export interface ReportObjective {
  priority: number;
  objective: string;
  expectedResult: string;
  successIndicator: string;
}

/**
 * Weekly progress checkpoint for a standing initiative (an initiative persists
 * across many weeks/reports; each report row is that week's checkpoint).
 * `weeklyProgress` is a 0-10 scale the methodologist sets each week.
 */
export interface ReportInitiative {
  name: string;
  category: string;
  weeklyProgress: number;
  /** weeklyProgress from this initiative's previous checkpoint, or null if this is its first week. */
  previousWeeklyProgress: number | null;
  status: string;
  briefUpdate: string;
}

/** A challenge/support need raised that week, with category and priority for triage. */
export interface ReportChallenge {
  category: string;
  description: string;
  status: string;
  actionNeeded: string;
  priority: string;
}

/** One logged activity for the week. */
export interface ReportActivity {
  date: string | null;
  description: string;
  category: string;
  stakeholder: string;
  /** Narrative outcome/result of the activity — richer detail than `description`. */
  resultProgress: string;
  status: string;
}

/** One stakeholder engaged that week. */
export interface ReportStakeholderEngagement {
  /** Stakeholder type, e.g. "Panam Sports", "Athlete", "National Federation". */
  type: string;
  /** Organizational level the type belongs to, e.g. "Executive", "Institutional", "Field". */
  level: string;
  name: string;
  role: string;
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
  methodologistPrimarySpecialization: string | null;
  methodologistSecondarySpecialization: string | null;
  submissionDate: string;
  status: ReportStatus;
  dashboardImage: string;
  dashboardPdf: string;
  phaseName: string | null;
  phaseStartDate: string | null;
  phaseEndDate: string | null;
  executiveSummary: string;
  supportNeeded: string;
  nextWeekFocus: string;
  objectives: ReportObjective[];
  initiatives: ReportInitiative[];
  challenges: ReportChallenge[];
  activities: ReportActivity[];
  stakeholderEngagements: ReportStakeholderEngagement[];
}

export interface ReportsData {
  nocs: Noc[];
  reports: MethodologistReport[];
}

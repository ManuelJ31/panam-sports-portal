export type ReportStatus = "Draft" | "Submitted" | "Reviewed" | "Approved" | "Returned";

/** Cohort of the Methodologist Program a NOC belongs to. */
export type ProgramGroup = "G1" | "G2";

export interface Noc {
  /** IOC/Panam Sports 3-letter country code, e.g. "DMA" */
  code: string;
  /** Official country name, e.g. "Dominica" */
  name: string;
  /** Panam Sports regional division from the source workbook's dimNOCGroup, e.g. "Group1" */
  nocGroup: string;
  /** Methodologist Program cohort (dimNOC.ProgramGroup). Unrelated to `nocGroup`. */
  programGroup: ProgramGroup;
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
  /** Stable initiative id from the source workbook, e.g. "INI001" — same id recurs every week this initiative is tracked. */
  id: string;
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
  /** ISO date the reporting week starts, e.g. "2026-06-22" */
  weekStartDate: string | null;
  /** ISO date the reporting week ends, e.g. "2026-06-28" */
  weekEndDate: string | null;
  methodologist: string;
  methodologistPrimarySpecialization: string | null;
  methodologistSecondarySpecialization: string | null;
  submissionDate: string;
  status: ReportStatus;
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

// ---------------------------------------------------------------------------
// Athlete tracking (data/athletes.json, produced by scripts/load_athletes.py)
// ---------------------------------------------------------------------------

export type AthleteStatus = "Active" | "Stopped";
export type ResultStatus = "Placed" | "DNF" | "DNS" | "DQ";

/**
 * One prioritized athlete. The date of birth is deliberately not part of the
 * data shipped to the portal: only the age (as of `AthletesData.asOf`).
 * Free-text notes are not shipped either.
 */
export interface Athlete {
  /** ATH-<NOC>-<nnn>, assigned by the load process and never reused. */
  id: string;
  nocCode: string;
  firstName: string;
  familyName: string;
  gender: "Female" | "Male";
  /** Age in whole years on `AthletesData.asOf`. */
  age: number;
  sportId: string;
  /** Discipline within the sport (e.g. Swimming within Aquatics); null if the sport has none. */
  disciplineId: string | null;
  /** Free text: the specific event or weight class, e.g. "100 m", "-57 kg". */
  event: string | null;
  isPara: boolean;
  /** "Lima 2027" | "LA28" | "Both" | "Other" */
  targetGames: string;
  dateAdded: string | null;
  campName: string | null;
  campDate: string | null;
  status: AthleteStatus;
  stoppedDate: string | null;
}

/** One result of one athlete at one event. */
export interface AthleteResult {
  id: string;
  athleteId: string;
  eventName: string;
  eventDate: string;
  eventLevelId: string;
  sportId: string;
  disciplineId: string | null;
  category: string | null;
  /** Same event written differently ("100 m", "100m") gives the same key; "" when there is no category. */
  eventKey: string;
  /** Relays and team sports are "Team"; they are tracked apart from individual results. */
  resultType: "Individual" | "Team";
  status: ResultStatus;
  position: number | null;
  participants: number | null;
  mark: string | null;
  /** (participants - position) / (participants - 1) * 100; null unless Placed with 2+ competitors. */
  standingPct: number | null;
  /** True when fewer competitors than `AthletesData.smallFieldThreshold`. */
  smallField: boolean;
}

export interface AthletesData {
  /** ISO date the ages were calculated on; null while there are no athletes. */
  asOf: string | null;
  smallFieldThreshold: number;
  sports: { id: string; name: string }[];
  disciplines: { id: string; sportId: string; name: string }[];
  eventLevels: { id: string; name: string; order: number }[];
  athletes: Athlete[];
  results: AthleteResult[];
}

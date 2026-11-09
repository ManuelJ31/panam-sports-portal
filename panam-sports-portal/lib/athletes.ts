import athletesData from "@/data/athletes.json";
import type { Athlete, AthleteResult, AthletesData, Noc } from "@/lib/types";
import { getAllNocs, getNoc } from "@/lib/reports";

const data = athletesData as unknown as AthletesData;

/**
 * Athlete names are shown by default (only Panam Sports executives, Olympic
 * Solidarity and the IOC have access). Build with ATHLETE_NAMES=hidden to show
 * the athlete ID instead of the name everywhere; the names are then never
 * placed in a page.
 */
export const SHOW_ATHLETE_NAMES = process.env.ATHLETE_NAMES !== "hidden";

const sportName = new Map(data.sports.map((s) => [s.id, s.name]));
const disciplineName = new Map(data.disciplines.map((d) => [d.id, d.name]));
const levelName = new Map(data.eventLevels.map((l) => [l.id, l.name]));

export const SMALL_FIELD_THRESHOLD = data.smallFieldThreshold;

/** The athlete section only exists once at least one athlete has been loaded. */
export function hasAthleteData(): boolean {
  return data.athletes.length > 0;
}

export function getAthletesAsOf(): string | null {
  return data.asOf;
}

export function getSportName(sportId: string): string {
  return sportName.get(sportId) ?? sportId;
}

export function getDisciplineName(disciplineId: string | null): string | null {
  return disciplineId ? (disciplineName.get(disciplineId) ?? disciplineId) : null;
}

export function getEventLevelName(levelId: string): string {
  return levelName.get(levelId) ?? levelId;
}

export function athleteLabel(a: Athlete): string {
  return SHOW_ATHLETE_NAMES ? `${a.firstName} ${a.familyName}` : a.id;
}

/** NOC codes that have at least one registered athlete (active or stopped). */
export function getAthleteNocCodes(): string[] {
  return [...new Set(data.athletes.map((a) => a.nocCode))];
}

export function countAthletesForNoc(nocCode: string): number {
  return data.athletes.filter((a) => a.nocCode === nocCode && a.status === "Active").length;
}

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

export interface GenderCount {
  female: number;
  male: number;
  total: number;
  para: number;
}

function tally(athletes: Athlete[]): GenderCount {
  const c: GenderCount = { female: 0, male: 0, total: 0, para: 0 };
  for (const a of athletes) {
    if (a.gender === "Female") c.female += 1;
    else c.male += 1;
    c.total += 1;
    if (a.isPara) c.para += 1;
  }
  return c;
}

function active(athletes: Athlete[]): Athlete[] {
  return athletes.filter((a) => a.status === "Active");
}

/** Active athletes by sport (SO points 7 and 8), most athletes first. */
export function sportRows(athletes: Athlete[]): { sportId: string; sport: string; counts: GenderCount }[] {
  const bySport = new Map<string, Athlete[]>();
  for (const a of active(athletes)) {
    bySport.set(a.sportId, [...(bySport.get(a.sportId) ?? []), a]);
  }
  return [...bySport.entries()]
    .map(([sportId, list]) => ({ sportId, sport: getSportName(sportId), counts: tally(list) }))
    .sort((x, y) => y.counts.total - x.counts.total || x.sport.localeCompare(y.sport));
}

export function targetGamesRows(athletes: Athlete[]): { label: string; count: number }[] {
  const order = ["Lima 2027", "LA28", "Both", "Other"];
  const counts = new Map<string, number>();
  for (const a of active(athletes)) counts.set(a.targetGames, (counts.get(a.targetGames) ?? 0) + 1);
  return order.filter((g) => counts.has(g)).map((g) => ({ label: g, count: counts.get(g)! }));
}

export function getOverview() {
  const athletes = data.athletes;
  const act = active(athletes);
  const results = data.results;
  const nocCodes = getAthleteNocCodes();

  const byNoc = getAllNocs().map((noc) => {
    const mine = athletes.filter((a) => a.nocCode === noc.code);
    const myActive = active(mine);
    const ids = new Set(mine.map((a) => a.id));
    const myResults = results.filter((r) => ids.has(r.athleteId));
    return {
      noc,
      hasAthletes: mine.length > 0,
      counts: tally(myActive),
      sports: new Set(myActive.map((a) => a.sportId)).size,
      results: myResults.length,
      lastEvent: myResults.map((r) => r.eventDate).sort().pop() ?? null,
    };
  });

  // Sport x committee matrix (active athletes).
  const matrixNocs = nocCodes
    .map((c) => getNoc(c))
    .filter((n): n is Noc => Boolean(n))
    .sort((a, b) => a.name.localeCompare(b.name));
  const matrix = sportRows(athletes).map((row) => ({
    ...row,
    perNoc: Object.fromEntries(
      matrixNocs.map((n) => [
        n.code,
        act.filter((a) => a.sportId === row.sportId && a.nocCode === n.code).length,
      ])
    ),
  }));

  return {
    asOf: data.asOf,
    counts: tally(act),
    stopped: athletes.length - act.length,
    sports: new Set(act.map((a) => a.sportId)).size,
    results: results.length,
    placedResults: results.filter((r) => r.standingPct !== null).length,
    committees: nocCodes.length,
    byNoc,
    matrixNocs,
    matrix,
    targetGames: targetGamesRows(athletes),
  };
}

// ---------------------------------------------------------------------------
// One committee
// ---------------------------------------------------------------------------

export interface ResultRow {
  id: string;
  date: string;
  eventName: string;
  level: string;
  category: string | null;
  status: string;
  position: number | null;
  participants: number | null;
  mark: string | null;
  standingPct: number | null;
  smallField: boolean;
}

export interface AthleteRow {
  id: string;
  label: string;
  age: number;
  gender: "Female" | "Male";
  sport: string;
  discipline: string | null;
  event: string | null;
  isPara: boolean;
  targetGames: string;
  stopped: boolean;
  campName: string | null;
  resultCount: number;
  latest: ResultRow | null;
  /** Latest minus first relative position (needs 2+ results with a position). */
  change: number | null;
  results: ResultRow[];
}

function toResultRow(r: AthleteResult): ResultRow {
  return {
    id: r.id,
    date: r.eventDate,
    eventName: r.eventName,
    level: getEventLevelName(r.eventLevelId),
    category: r.category,
    status: r.status,
    position: r.position,
    participants: r.participants,
    mark: r.mark,
    standingPct: r.standingPct,
    smallField: r.smallField,
  };
}

export function getNocAthleteView(nocCode: string) {
  const noc = getNoc(nocCode);
  const athletes = data.athletes.filter((a) => a.nocCode === nocCode);
  if (!noc || athletes.length === 0) return undefined;

  const roster: AthleteRow[] = athletes
    .map((a) => {
      const results = data.results
        .filter((r) => r.athleteId === a.id)
        .sort((x, y) => x.eventDate.localeCompare(y.eventDate) || x.id.localeCompare(y.id))
        .map(toResultRow);
      const placed = results.filter((r) => r.standingPct !== null);
      const row: AthleteRow = {
        id: a.id,
        label: athleteLabel(a),
        age: a.age,
        gender: a.gender,
        sport: getSportName(a.sportId),
        discipline: getDisciplineName(a.disciplineId),
        event: a.event,
        isPara: a.isPara,
        targetGames: a.targetGames,
        stopped: a.status === "Stopped",
        campName: a.campName,
        resultCount: results.length,
        latest: results[results.length - 1] ?? null,
        change:
          placed.length >= 2
            ? Math.round((placed[placed.length - 1].standingPct! - placed[0].standingPct!) * 10) / 10
            : null,
        results,
      };
      // Active athletes first; then by family name (or by ID when names are hidden).
      const sortKey = SHOW_ATHLETE_NAMES ? `${a.familyName} ${a.firstName}`.toLowerCase() : a.id;
      return { row, sortKey };
    })
    .sort(
      (x, y) => Number(x.row.stopped) - Number(y.row.stopped) || x.sortKey.localeCompare(y.sortKey)
    )
    .map((x) => x.row);

  const act = active(athletes);
  const ids = new Set(athletes.map((a) => a.id));
  return {
    noc,
    asOf: data.asOf,
    counts: tally(act),
    stopped: athletes.length - act.length,
    sports: sportRows(athletes),
    targetGames: targetGamesRows(athletes),
    results: data.results.filter((r) => ids.has(r.athleteId)).length,
    roster,
  };
}

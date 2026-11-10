# -*- coding: utf-8 -*-
"""Load athlete registrations and competition results (athlete tracking).

Usage (from panam-sports-portal/):
    python scripts/load_athletes.py --init                 # create the workbook once
    python scripts/load_athletes.py                        # load new raw rows, rewrite athletes.json
    python scripts/load_athletes.py --dry-run              # validate only, write nothing

Options:
    --xlsx PATH      workbook to read (default: OneDrive SPORTINXL\\Projects\\PS_Athletes_Data.xlsx)
    --out-xlsx PATH  write the updated workbook here instead (use it if Excel has the file open)
    --out-json PATH  default: data/athletes.json
    --as-of DATE     YYYY-MM-DD used for ages and "future date" checks (default: today)

Flow:
    Form 1 export  -> dbRaw_Athletes          Roster template -> dbRaw_RosterTemplate
    Form 2 export  -> dbRaw_Results           Results template -> dbRaw_ResultsTemplate
    (paste the export or the whole template sheet, header row included)
                 |
                 v   this script
    factAthletes, factResults (the normalized tables), loadLog, loadIssues
                 |
                 +--> data/athletes.json   (portal; no date of birth, no free-text notes)
                 +--> scripts/methodologist_workbooks.py reads the same workbook

Rules:
  * Each raw row is processed once (its hash goes to loadLog). A row that fails
    validation is NOT logged: it is reported in loadIssues and retried on the
    next run, so fixing the athlete list is enough to let a result load.
  * Sport and discipline come from one dropdown ("Aquatics - Swimming", "Archery";
    list: sheet lstSportOptions, built from dimSports + dimDisciplines; its Option text is
    editable and the canonical "Sport - Discipline" spelling is always accepted too). A sport with
    disciplines needs one of them; a plain sport name is accepted only if it is
    unambiguous. Facts store SportID and DisciplineID (blank if the sport has none).
  * Athlete IDs are ATH-<NOC>-<nnn>, assigned in order and never reused.
  * A "New athlete" row that matches an existing athlete (same NOC, first name,
    family name, date of birth) is reported as already registered, not duplicated.
  * Results are checked against the athlete list: ID must exist, belong to the
    methodologist's NOC and (if given) match the family name.
  * Result type is Individual (default when blank) or Team (relays, team sports).
    A Team result can list several athletes in "Team result: athlete IDs" (separated
    by commas, spaces or line breaks): one result is created per athlete, all with
    the same position and number of teams. Several IDs with Individual is an error.
  * The evolution of an athlete is tracked per event: results with the same Category
    (ignoring case, spaces and punctuation: "100 m" = "100m") and the same type form
    one series. Fill Category for athletes who compete in several events.
  * StandingPct = (Participants - Position) / (Participants - 1) * 100, only for
    status Placed with at least 2 competitors. SmallField = Yes when Placed with
    fewer than SmallFieldThreshold competitors (sheet "settings", default 8).
    SmallField is only a flag: the result is kept and shown.
"""
import argparse
import hashlib
import json
import re
import sys
import unicodedata
from datetime import date, datetime, timedelta
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

PORTAL_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_XLSX = r"C:\Users\manue\OneDrive\SPORTINXL\Projects\PS_Athletes_Data.xlsx"
DEFAULT_JSON = PORTAL_ROOT / "data" / "athletes.json"

# ----------------------------------------------------------------------------
# Reference lists written into a new workbook (then editable in the workbook).
# ----------------------------------------------------------------------------
METHODOLOGISTS = [
    ("MET001", "Andres Duque", "BIZ"), ("MET003", "Karla Aleman", "SUR"),
    ("MET004", "Leo Cursino", "SKN"), ("MET005", "Richard Britton", "LCA"),
    ("MET006", "Scott Novack", "TTO"), ("MET007", "Sofia Garcia", "GRN"),
    ("MET008", "Valentyna Zolotarova", "DMA"), ("MET009", "Tatiana Obregon", "ANT"),
    ("MET010", "David Sampaio", "HON"), ("MET011", "Luca Carvalho", "CAY"),
]
NOCS = [
    ("BIZ", "Belize", "G1"), ("DMA", "Dominica", "G1"), ("GRN", "Grenada", "G1"),
    ("LCA", "St. Lucia", "G1"), ("SKN", "St. Kitts & Nevis", "G1"),
    ("SUR", "Suriname", "G1"), ("TTO", "Trinidad & Tobago", "G1"),
    ("ANT", "Antigua & Barbuda", "G2"), ("CAY", "Cayman Islands", "G2"),
    ("HON", "Honduras", "G2"),
]
SPORTS = [  # (SportName, SportCode, [(DisciplineName, DisciplineCode), ...])
    ('Aquatics', 'AQU', [
        ('Artistic Swimming', 'SWA'),
        ('Diving', 'DIV'),
        ('Open Water Swimming', 'OWS'),
        ('Swimming', 'SWM'),
        ('Water Polo', 'WPO'),
    ]),
    ('Archery', 'ARC', []),
    ('Athletics', 'ATH', []),
    ('Badminton', 'BDM', []),
    ('Baseball', 'BBL', []),
    ('Basketball', 'BKB', [
        ('Basketball 5x5', 'BKB'),
        ('3x3 Basketball', 'BK3'),
    ]),
    ('Bowling', 'BWL', []),
    ('Boxing', 'BOX', []),
    ('Canoe / Kayak', 'CAS', [
        ('Canoe Sprint', 'CSP'),
        ('Canoe Slalom', 'CSL'),
    ]),
    ('Chess', 'CHS', []),
    ('Cricket', 'CKT', []),
    ('Cycling', 'CYC', [
        ('BMX Freestyle', 'BMF'),
        ('BMX Racing', 'BMX'),
        ('Mountain Bike', 'MTB'),
        ('Cycling Road', 'CRD'),
        ('Cycling Track', 'CRT'),
    ]),
    ('E-Sports', 'ELS', []),
    ('Equestrian', 'EQU', [
        ('Equestrian Dressage', 'EDR'),
        ('Equestrian Jumping', 'EJP'),
        ('Equestrian Eventing', 'EVE'),
    ]),
    ('Fencing', 'FEN', []),
    ('Flag Football', 'FFB', []),
    ('Football', 'FBL', []),
    ('Golf', 'GLF', []),
    ('Gymnastics', 'GYM', [
        ('Gymnastics Artistic', 'GAR'),
        ('Gymnastics Rhythmic', 'GRY'),
        ('Gymnastics Trampoline', 'GTR'),
    ]),
    ('Handball', 'HBL', []),
    ('Hockey', 'HOC', []),
    ('Judo', 'JUD', []),
    ('Karate', 'KTE', []),
    ('Lacrosse', 'LAC', []),
    ('Modern Pentathlon', 'MPN', []),
    ('Netball', 'NBL', []),
    ('Racquetball', 'RQL', []),
    ('Roller Sports', 'RSP', [
        ('Speed Skating', 'SSK'),
        ('Artistic Skating', 'ASK'),
        ('Skateboarding', 'SKB'),
    ]),
    ('Rowing', 'ROW', [
        ('Coastal', 'RCB'),
        ('Rowing', 'ROW'),
    ]),
    ('Rugby', 'RUG', [
        ('Rugby 7', 'RU7'),
    ]),
    ('Sailing', 'SAL', []),
    ('Shooting', 'SHO', []),
    ('Softball', 'SBL', []),
    ('Sport Climbing', 'CLB', []),
    ('Squash', 'SQU', []),
    ('Surfing', 'SRF', []),
    ('Table Tennis', 'TTE', []),
    ('Taekwondo', 'TKW', []),
    ('Tennis', 'TEN', []),
    ('Triathlon', 'TRI', []),
    ('Volleyball', 'VOL', [
        ('Indoor Volleyball', 'VVO'),
        ('Beach Volleyball', 'VBV'),
    ]),
    ('Water Ski', 'WSK', []),
    ('Weightlifting', 'WLF', []),
    ('Wrestling', 'WRE', []),
    ('Other (specify in notes)', None, []),
]
# 'Other' has no code and no disciplines. A sport with disciplines must be registered with one of them.
EVENT_LEVELS = [
    ("EL1", "National", 1, "National championships, national trials, national league"),
    ("EL2", "Regional / multi-nation", 2, "e.g. CARIFTA, Central American and Caribbean Games, Commonwealth Games"),
    ("EL3", "Continental", 3, "Pan American / Americas level championships and Games"),
    ("EL4", "World / Olympic", 4, "World championships, Olympic Games, World Cups"),
]
RESULT_STATUS = [
    ("Placed", "Finished with a position; counts for the relative standing"),
    ("DNF", "Did not finish"), ("DNS", "Did not start"), ("DQ", "Disqualified"),
]
TARGET_GAMES = ["Lima 2027", "LA28", "Both", "Other"]
SETTINGS = [
    ("SmallFieldThreshold", 8, "Placed results with fewer competitors than this are flagged SmallField = Yes."),
    ("PendingDays", 90, "Methodologist workbook: athletes with no result in this many days are listed as pending."),
]

ATHLETE_COLS = [
    "AthleteID", "NOCCode", "MethodologistID", "FirstName", "FamilyName", "FullName", "Gender",
    "DateOfBirth", "SportID", "DisciplineID", "Event", "IsPara", "TargetGames", "DateAdded",
    "CampName", "CampDate", "Status", "StoppedDate", "Notes",
]
RESULT_COLS = [
    "ResultID", "AthleteID", "EventName", "EventDate", "EventLevelID", "SportID", "DisciplineID", "Category",
    "ResultType", "ResultStatus", "Position", "Participants", "Mark", "StandingPct", "SmallField", "Notes",
    "LoadedOn",
]
DATE_COLS = {"DateOfBirth", "DateAdded", "CampDate", "StoppedDate", "EventDate", "LoadedOn"}

# ----------------------------------------------------------------------------
# Header aliases: whatever Forms / the templates call a column -> one field.
# ----------------------------------------------------------------------------


def norm(value):
    """Lowercase, no accents, only letters/digits separated by single spaces."""
    s = unicodedata.normalize("NFKD", str(value))
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def _aliases(table):
    out = {}
    for field, names in table.items():
        for n in names:
            out[norm(n)] = field
    return out


ATHLETE_ALIASES = _aliases({
    "request": ["Request type"],
    "methodologist": ["Methodologist"],
    "noc": ["Assigned NOC", "NOC"],
    "athlete_id": ["Athlete ID", "Athlete ID (leave blank)"],
    "first_name": ["First name"],
    "family_name": ["Family name"],
    "gender": ["Gender"],
    "dob": ["Date of birth"],
    "sport": ["Sport and discipline", "Sport"],
    "event": ["Event", "Event or discipline"],
    "para": ["Para athlete?", "Para athlete"],
    "target_games": ["Target games"],
    "date_added": ["Date added to follow-up"],
    "camp_attended": ["Has the athlete attended a Panam Sports camp?"],
    # The roster template keeps the camp name in "Panam Sports camp attended".
    "camp_name": ["Camp name", "Panam Sports camp attended"],
    "camp_date": ["Camp date"],
    "notes": ["Notes"],
    "submitted": ["Completion time", "Submission date", "Submitted"],
})
RESULT_ALIASES = _aliases({
    "methodologist": ["Methodologist"],
    "noc": ["Assigned NOC", "NOC"],
    "event_name": ["Event name"],
    "event_date": ["Event date"],
    "event_level": ["Event level"],
    "sport": ["Sport and discipline", "Sport"],
    "athlete_id": ["Athlete ID"],
    "family_check": ["Family name (for checking)", "Family name"],
    "category": ["Category", "Category or discipline"],
    "result_type": ["Result type"],
    "team_ids": ["Team result: athlete IDs", "Team athlete IDs"],
    "status": ["Result status"],
    "position": ["Final position"],
    "participants": ["Number of competitors in the category", "Competitors in category"],
    "mark": ["Mark or time"],
    "notes": ["Notes"],
    "add_another": ["Add another athlete from this event?"],
    "submitted": ["Completion time", "Submission date", "Submitted"],
})
# Fields repeated once per athlete block in Form 2 (the k-th occurrence = block k).
RESULT_BLOCK_FIELDS = {"athlete_id", "team_ids", "result_type", "family_check", "category", "status", "position",
                       "participants", "mark", "notes", "add_another"}


# ----------------------------------------------------------------------------
# Value parsing
# ----------------------------------------------------------------------------
def blank(v):
    return v is None or (isinstance(v, str) and not v.strip())


def clean(v):
    return v.strip() if isinstance(v, str) else v


def to_date(v):
    if blank(v):
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return date(1899, 12, 30) + timedelta(days=int(v))
    s = str(v).strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    raise ValueError(f"not a date: {s!r} (use dd/mm/yyyy)")


def to_int(v):
    if blank(v):
        return None
    if isinstance(v, bool):
        raise ValueError(f"not a whole number: {v!r}")
    if isinstance(v, (int, float)):
        if float(v) != int(v):
            raise ValueError(f"not a whole number: {v!r}")
        return int(v)
    s = str(v).strip()
    if re.fullmatch(r"\d+", s):
        return int(s)
    raise ValueError(f"not a whole number: {s!r}")


def yes_no(v):
    s = norm(v) if not blank(v) else ""
    if s in ("yes", "y", "si", "true", "1"):
        return "Yes"
    if s in ("no", "n", "false", "0"):
        return "No"
    return None


def gender_of(v):
    s = norm(v) if not blank(v) else ""
    if s in ("female", "f", "woman", "women", "femenino", "mujer"):
        return "Female"
    if s in ("male", "m", "man", "men", "masculino", "hombre"):
        return "Male"
    return None


def text(v):
    return re.sub(r"\s+", " ", str(v)).strip() if not blank(v) else ""


def split_ids(value):
    """One or several athlete IDs separated by commas, semicolons, spaces or line breaks."""
    if blank(value):
        return []
    return [t for t in re.split(r"[\s,;]+", str(value).strip().upper()) if t]


def parse_result_type(value):
    """Individual (default when blank) or Team; None if unrecognised."""
    if blank(value):
        return "Individual"
    s = norm(value)
    if s.startswith("team"):
        return "Team"
    if s.startswith("individual"):
        return "Individual"
    return None


def category_key(category):
    """Same event written differently ("100 m", "100m", "100 M") -> the same key."""
    return re.sub(r"[^a-z0-9]+", "", norm(category)) if not blank(category) else ""


def age_on(dob, ref):
    return ref.year - dob.year - ((ref.month, ref.day) < (dob.month, dob.day))


def standing_pct(status, position, participants):
    """0-100; 100 = won, 0 = last. Only for Placed with at least 2 competitors."""
    if status != "Placed" or position is None or participants is None or participants < 2:
        return None
    return round((participants - position) / (participants - 1) * 100, 1)


def small_field(status, participants, threshold):
    if status != "Placed" or participants is None:
        return ""
    return "Yes" if participants < threshold else "No"


class Issues:
    def __init__(self):
        self.items = []

    def add(self, level, sheet, row, msg, hint=""):
        self.items.append((level, sheet, row, msg, hint))

    def count(self, level):
        return sum(1 for i in self.items if i[0] == level)


# ----------------------------------------------------------------------------
# Workbook helpers
# ----------------------------------------------------------------------------
HEAD_FILL = PatternFill("solid", fgColor="1E3058")
HEAD_FONT = Font(name="Arial", bold=True, color="FFFFFF", size=10)
BODY_FONT = Font(name="Arial", size=10)


def write_table(ws, headers, rows, widths=None, date_cols=()):
    for c, h in enumerate(headers, 1):
        cell = ws.cell(1, c, h)
        cell.font = HEAD_FONT
        cell.fill = HEAD_FILL
        cell.alignment = Alignment(vertical="center", wrap_text=True)
    for r, row in enumerate(rows, 2):
        for c, v in enumerate(row, 1):
            cell = ws.cell(r, c, v)
            cell.font = BODY_FONT
            if headers[c - 1] in date_cols and v is not None:
                cell.number_format = "dd/mm/yyyy"
    for c, h in enumerate(headers, 1):
        w = (widths or {}).get(h) or min(max(len(str(h)) + 3, 12), 40)
        ws.column_dimensions[get_column_letter(c)].width = w
    ws.freeze_panes = "A2"
    if rows:
        ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{len(rows) + 1}"


def sheet_dicts(ws):
    """Rows of a header-on-row-1 sheet as dicts; empty list if the sheet is empty."""
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [h for h in rows[0]]
    out = []
    for row in rows[1:]:
        if all(blank(v) for v in row):
            continue
        out.append({h: v for h, v in zip(headers, row) if h is not None})
    return out


def replace_sheet(wb, name, index=None):
    if name in wb.sheetnames:
        pos = wb.sheetnames.index(name)
        del wb[name]
        return wb.create_sheet(name, pos)
    return wb.create_sheet(name, index)


FORM1_HEADERS = [
    "Completion time", "Request type", "Methodologist", "Assigned NOC", "Athlete ID", "First name",
    "Family name", "Gender", "Date of birth", "Sport and discipline", "Event", "Para athlete?",
    "Target games", "Date added to follow-up", "Has the athlete attended a Panam Sports camp?",
    "Camp name", "Camp date", "Notes"]
FORM2_HEADERS = ["Completion time", "Methodologist", "Assigned NOC", "Event name", "Event date", "Event level",
                 "Sport and discipline"] + [
    h for _ in range(5) for h in ("Result type", "Athlete ID", "Team result: athlete IDs", "Category",
                                  "Result status", "Final position",
                                  "Number of competitors in the category", "Mark or time", "Notes",
                                  "Add another athlete from this event?")]


def sport_table_rows():
    """dimSports and dimDisciplines rows built from SPORTS (IDs are SP### and DI###)."""
    sports, discs = [], []
    for i, (name, code, ds) in enumerate(SPORTS, 1):
        sid = f"SP{i:03d}"
        sports.append((sid, name, code))
        for dname, dcode in ds:
            discs.append((f"DI{len(discs) + 1:03d}", sid, dname, dcode))
    return sports, discs


def option_rows(sports, discs):
    """(SportID, DisciplineID, Option) for the sport/discipline dropdown."""
    by_sport = {}
    for did, sid, dname, _c in discs:
        by_sport.setdefault(sid, []).append((did, dname))
    out = []
    for sid, name, _code in sports:
        if sid in by_sport:
            out += [(sid, did, f"{name} - {dname}") for did, dname in by_sport[sid]]
        else:
            out.append((sid, None, name))
    return out


def write_option_sheet(wb, rows):
    ws = replace_sheet(wb, "lstSportOptions",
                       index=wb.sheetnames.index("dimDisciplines") + 1 if "dimDisciplines" in wb.sheetnames else None)
    write_table(ws, ["SportID", "DisciplineID", "Option"], rows, widths={"Option": 44})


def write_sport_tables(wb):
    """(Re)write dimSports, dimDisciplines and lstSportOptions from SPORTS."""
    sports, discs = sport_table_rows()
    write_table(replace_sheet(wb, "dimSports"), ["SportID", "SportName", "SportCode"], sports,
                widths={"SportName": 30})
    write_table(replace_sheet(wb, "dimDisciplines", index=wb.sheetnames.index("dimSports") + 1),
                ["DisciplineID", "SportID", "DisciplineName", "DisciplineCode"], discs,
                widths={"DisciplineName": 30})
    write_option_sheet(wb, option_rows(sports, discs))


def init_workbook(path):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Leer primero"
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 3
    ws.column_dimensions["B"].width = 28
    ws.column_dimensions["C"].width = 110
    ws["B2"] = "PS_Athletes_Data: seguimiento de atletas priorizados"
    ws["B2"].font = Font(name="Arial", size=14, bold=True, color="1E3058")
    lines = [
        ("dbRaw_Athletes", "Pega aqui la exportacion del Formulario 1 (encabezado incluido)."),
        ("dbRaw_RosterTemplate", "Pega aqui la hoja 'Plantilla Roster' completa (encabezado incluido) para rosters grandes."),
        ("dbRaw_Results", "Pega aqui la exportacion del Formulario 2 (encabezado incluido)."),
        ("dbRaw_ResultsTemplate", "Pega aqui la hoja 'Plantilla Resultados' completa para muchos atletas o varios eventos."),
        ("factAthletes / factResults", "Tablas normalizadas. Las escribe el script; no se editan a mano."),
        ("loadIssues", "Filas que no se cargaron y por que. Corrige la fila (o el registro del atleta) y vuelve a ejecutar."),
        ("loadLog", "Filas crudas ya procesadas. Si se borra una fila de aqui, se vuelve a procesar."),
        ("dim* y settings", "Listas de referencia (deportes, disciplinas, niveles de evento, metodologos, CON) y parametros. Se pueden editar."),
        ("lstSportOptions", "Lista desplegable de los formularios y las plantillas: una opcion por deporte o disciplina. Puedes cambiar el texto de la columna Option (no los IDs). El script agrega las filas que falten y respeta tus textos."),
        ("Ejecutar", "python scripts/load_athletes.py   (desde panam-sports-portal/). Genera data/athletes.json para el portal."),
    ]
    for i, (a, b) in enumerate(lines, 4):
        ws.cell(i, 2, a).font = Font(name="Arial", bold=True, size=10)
        ws.cell(i, 3, b).font = BODY_FONT

    # Raw sheets, with the headers Microsoft Forms would export.
    write_table(wb.create_sheet("dbRaw_Athletes"), FORM1_HEADERS, [])
    write_table(wb.create_sheet("dbRaw_Results"), FORM2_HEADERS, [])
    for name in ("dbRaw_RosterTemplate", "dbRaw_ResultsTemplate"):
        w = wb.create_sheet(name)
        w["A1"] = "Pega aqui la hoja de la plantilla completa, encabezado incluido (esta nota se sobrescribe)."
        w["A1"].font = Font(name="Arial", italic=True, color="777777")

    write_table(wb.create_sheet("factAthletes"), ATHLETE_COLS, [], date_cols=DATE_COLS)
    write_table(wb.create_sheet("factResults"), RESULT_COLS, [], date_cols=DATE_COLS)
    write_table(wb.create_sheet("loadLog"), ["RowHash", "Sheet", "Row", "ProcessedOn", "Note"], [])
    write_table(wb.create_sheet("loadIssues"), ["Level", "Sheet", "Row", "Message", "Raw values"], [])

    write_sport_tables(wb)
    write_table(wb.create_sheet("dimEventLevel"), ["EventLevelID", "EventLevelName", "SortOrder", "Description"],
                EVENT_LEVELS, widths={"EventLevelName": 26, "Description": 70})
    write_table(wb.create_sheet("dimResultStatus"), ["ResultStatus", "Description"], RESULT_STATUS,
                widths={"Description": 60})
    write_table(wb.create_sheet("dimMethodologists"), ["MethodologistID", "FullName", "NOCCode"],
                METHODOLOGISTS, widths={"FullName": 26})
    write_table(wb.create_sheet("dimNOC"), ["NOCCode", "NOCName", "ProgramGroup"], NOCS,
                widths={"NOCName": 24})
    write_table(wb.create_sheet("settings"), ["Key", "Value", "Description"], SETTINGS,
                widths={"Key": 24, "Description": 90})
    wb.save(path)


def migrate_sport_tables(path):
    """One-off: move a workbook from the flat dimSports layout to dimSports + dimDisciplines.

    Only allowed while the workbook holds no athletes, results or raw rows, because the
    sport IDs are renumbered. Rewrites the raw/fact headers and the three sport sheets.
    """
    wb = openpyxl.load_workbook(path)
    for name in ("dbRaw_Athletes", "dbRaw_Results", "factAthletes", "factResults"):
        if len(sheet_dicts(wb[name])) > 0:
            sys.exit(f"{name} already has rows: IDs would change. Migrate by hand (nothing was modified).")
    for name, headers, cols in (("dbRaw_Athletes", FORM1_HEADERS, ()), ("dbRaw_Results", FORM2_HEADERS, ()),
                                ("factAthletes", ATHLETE_COLS, DATE_COLS), ("factResults", RESULT_COLS, DATE_COLS)):
        write_table(replace_sheet(wb, name), headers, [], date_cols=cols)
    write_sport_tables(wb)
    wb.save(path)


# ----------------------------------------------------------------------------
# Raw sheet reading
# ----------------------------------------------------------------------------
def read_raw(ws, aliases, repeating=()):
    """Return [(row_number, {field: [values by column order]}, raw_row_tuple)].

    `repeating` are the fields of a repeated block. Microsoft Forms exports the
    repeated questions with a number appended ("Athlete ID", "Athlete ID1", ...), so
    for those fields a trailing number on the header is ignored.
    """

    def field_of(header):
        n = norm(header)
        if n in aliases:
            return aliases[n]
        m = re.fullmatch(r"(.*?)\s*\d+", n)
        if m and aliases.get(m.group(1)) in repeating:
            return aliases[m.group(1)]
        return None

    rows = list(ws.iter_rows(values_only=True))
    best_score, best_i = 0, None
    for i, row in enumerate(rows[:8]):
        score = sum(1 for v in row if not blank(v) and norm(v) in aliases)
        if score > best_score:
            best_score, best_i = score, i
    if best_i is None or best_score < 3:
        return []
    fields = [field_of(v) if not blank(v) else None for v in rows[best_i]]
    out = []
    for i in range(best_i + 1, len(rows)):
        row = rows[i]
        if all(blank(v) for v in row):
            continue
        rec = {}
        for f, v in zip(fields, row):
            if f:
                rec.setdefault(f, []).append(clean(v))
        first = lambda k: (rec.get(k) or [None])[0]  # noqa: E731
        # Example rows of the templates (delete-before-sending rows).
        if (str(first("noc") or "").upper() == "XXX" or str(first("athlete_id") or "").upper() == "ATH-XXX-000"
                or str(first("first_name") or "").upper() == "EXAMPLE"):
            continue
        out.append((i + 1, rec, row))
    return out


def row_hash(sheet, row):
    parts = [sheet] + ["" if v is None else (v.isoformat() if isinstance(v, (date, datetime)) else str(v)) for v in row]
    return hashlib.sha1("|".join(parts).encode("utf-8")).hexdigest()[:16]


def summary(row, n=6):
    vals = [("" if v is None else (v.strftime("%d/%m/%Y") if isinstance(v, (date, datetime)) else str(v)))
            for v in row if not blank(v)]
    return " | ".join(vals[:n])


def get(rec, field, k=0):
    vals = rec.get(field)
    if not vals or k >= len(vals):
        return None
    return vals[k]


# ----------------------------------------------------------------------------
# Loading
# ----------------------------------------------------------------------------
class Ref:
    """Reference lists read from the workbook."""

    def __init__(self, wb):
        self._read_sports(wb)
        self.levels = {}
        self.level_rows = sheet_dicts(wb["dimEventLevel"])
        for r in self.level_rows:
            self.levels[self._lvl(r["EventLevelName"])] = r["EventLevelID"]
            self.levels[norm(r["EventLevelID"])] = r["EventLevelID"]
        self.statuses = {norm(r["ResultStatus"]): r["ResultStatus"] for r in sheet_dicts(wb["dimResultStatus"])}
        self.methodologists = {}
        self.method_names = {}
        for r in sheet_dicts(wb["dimMethodologists"]):
            self.methodologists[norm(r["FullName"])] = (r["MethodologistID"], r["NOCCode"])
            self.methodologists[norm(r["MethodologistID"])] = (r["MethodologistID"], r["NOCCode"])
            self.method_names[r["MethodologistID"]] = r["FullName"]
        self.nocs = {r["NOCCode"]: r for r in sheet_dicts(wb["dimNOC"])}
        self.settings = {r["Key"]: r["Value"] for r in sheet_dicts(wb["settings"])}
        self.threshold = int(self.settings.get("SmallFieldThreshold", 8))
        self.target_games = {norm(g): g for g in TARGET_GAMES}
        self.target_games.update({"la 2028": "LA28", "lima2027": "Lima 2027", "lima 27": "Lima 2027"})

    def _read_sports(self, wb):
        if "dimDisciplines" not in wb.sheetnames:
            sys.exit("The workbook has no dimDisciplines sheet (older layout). Run: python scripts/load_athletes.py --migrate-sport-tables")
        self.sport_rows = sheet_dicts(wb["dimSports"])
        self.discipline_rows = sheet_dicts(wb["dimDisciplines"])
        self.sport_names = {r["SportID"]: r["SportName"] for r in self.sport_rows}
        self.discipline_names = {}
        by_sport = {}
        for r in self.discipline_rows:
            if r["SportID"] not in self.sport_names:
                sys.exit(f"dimDisciplines: {r['DisciplineID']} points to unknown sport {r['SportID']}.")
            self.discipline_names[r["DisciplineID"]] = r["DisciplineName"]
            by_sport.setdefault(r["SportID"], []).append(r["DisciplineID"])
        self.sport_disciplines = by_sport
        # lstSportOptions.Option is editable: the text shown in the Forms dropdown for each
        # (SportID, DisciplineID). The canonical "Sport - Discipline" stays accepted too.
        custom = {}
        if "lstSportOptions" in wb.sheetnames:
            for r in sheet_dicts(wb["lstSportOptions"]):
                if not blank(r.get("Option")):
                    custom[(r.get("SportID"), r.get("DisciplineID") or None)] = text(r["Option"])
        # Accepted spellings -> (SportID, DisciplineID).
        self._labels, self._disc_alone, self._sport_only = {}, {}, {}
        self.options = []
        for r in self.sport_rows:
            sid, name = r["SportID"], r["SportName"]
            self._sport_only[norm(name)] = sid
            pairs = [(None, name)] if sid not in by_sport else [
                (did, f"{name} - {self.discipline_names[did]}") for did in by_sport[sid]]
            for did, canonical in pairs:
                shown = custom.get((sid, did), canonical)
                self._add_label(norm(shown), (sid, did), shown, listed=True)
                if norm(canonical) != norm(shown):
                    self._add_label(norm(canonical), (sid, did), canonical, listed=False)
        count = {}
        for did, dname in self.discipline_names.items():
            count.setdefault(norm(dname), []).append(did)
        for key, dids in count.items():
            if len(dids) == 1:  # "Beach Volleyball" alone is fine; a name used twice is not
                sid = next(r["SportID"] for r in self.discipline_rows if r["DisciplineID"] == dids[0])
                self._disc_alone[key] = (sid, dids[0])

    def _add_label(self, key, ids, label, listed):
        if key in self._labels and self._labels[key] != ids:
            sys.exit(f"lstSportOptions/dimDisciplines: the option {label!r} is used for two different sports/disciplines.")
        self._labels[key] = ids
        if listed:
            self.options.append((ids[0], ids[1], label))

    def sport_label(self, sport_id, discipline_id=None):
        name = self.sport_names.get(sport_id, sport_id)
        return f"{name} - {self.discipline_names[discipline_id]}" if discipline_id else name

    def resolve_sport(self, value):
        """Text from the form -> (SportID, DisciplineID, error). Sport alone is accepted when unambiguous."""
        key = norm(value)
        if key in self._labels:
            return (*self._labels[key], None)
        if key in self._disc_alone:
            return (*self._disc_alone[key], None)
        sid = self._sport_only.get(key)
        if sid:
            discs = self.sport_disciplines.get(sid, [])
            if len(discs) == 1:
                return sid, discs[0], None
            options = ", ".join(self.discipline_names[d] for d in discs)
            return None, None, f"sport {text(value)!r} needs a discipline: use 'Sport - Discipline' ({options})"
        return None, None, f"unknown sport {text(value)!r} (see lstSportOptions)"

    @staticmethod
    def _lvl(name):
        # "Regional or multi-nation" and "Regional / multi-nation" are the same level.
        return " ".join(w for w in norm(name).split() if w not in ("or", "and"))

    def level_id(self, value):
        return self.levels.get(self._lvl(value))


def load_state(wb):
    athletes = {}
    for r in sheet_dicts(wb["factAthletes"]):
        rec = {c: r.get(c) for c in ATHLETE_COLS}
        for c in DATE_COLS & set(ATHLETE_COLS):
            rec[c] = to_date(rec[c]) if rec.get(c) is not None else None
        athletes[rec["AthleteID"]] = rec
    results = {}
    for r in sheet_dicts(wb["factResults"]):
        rec = {c: r.get(c) for c in RESULT_COLS}
        rec["ResultType"] = rec.get("ResultType") or "Individual"
        for c in DATE_COLS & set(RESULT_COLS):
            rec[c] = to_date(rec[c]) if rec.get(c) is not None else None
        results[rec["ResultID"]] = rec
    log = {r["RowHash"] for r in sheet_dicts(wb["loadLog"])}
    log_rows = [(r["RowHash"], r["Sheet"], r["Row"], r["ProcessedOn"], r["Note"]) for r in sheet_dicts(wb["loadLog"])]
    return athletes, results, log, log_rows


def ath_key(noc, first, family, dob):
    return (noc, norm(first), norm(family), dob)


def parse_athlete_fields(rec, ref, today):
    """Validate the athlete columns of one raw row. Returns (fields, errors, warnings)."""
    errs, warns, f = [], [], {}

    def need(name, label):
        v = get(rec, name)
        if blank(v):
            errs.append(f"{label} is missing")
            return None
        return v

    noc = need("noc", "Assigned NOC")
    meth = need("methodologist", "Methodologist")
    if noc is not None:
        noc = str(noc).strip().upper()
        if noc not in ref.nocs:
            errs.append(f"unknown NOC {noc!r}")
            noc = None
    if meth is not None:
        m = ref.methodologists.get(norm(meth))
        if not m:
            errs.append(f"unknown methodologist {meth!r}")
        else:
            f["MethodologistID"] = m[0]
            if noc is None:
                pass
            elif m[1] != noc:
                errs.append(f"methodologist {meth!r} is assigned to {m[1]}, not {noc}")
    f["NOCCode"] = noc

    for name, label, col in (("first_name", "First name", "FirstName"), ("family_name", "Family name", "FamilyName")):
        v = need(name, label)
        f[col] = text(v) if v is not None else None

    v = need("gender", "Gender")
    if v is not None:
        g = gender_of(v)
        if g is None:
            errs.append(f"Gender {v!r} is not Female or Male")
        f["Gender"] = g

    v = need("dob", "Date of birth")
    f["DateOfBirth"] = None
    if v is not None:
        try:
            d = to_date(v)
            if d.year < 1940 or d.year > 2020:
                errs.append(f"Date of birth {d:%d/%m/%Y} is outside 1940-2020")
            else:
                f["DateOfBirth"] = d
        except ValueError as e:
            errs.append(f"Date of birth: {e}")

    v = need("sport", "Sport and discipline")
    f["SportID"] = f["DisciplineID"] = None
    if v is not None:
        sid, did, err = ref.resolve_sport(v)
        if err:
            errs.append(err)
        f["SportID"], f["DisciplineID"] = sid, did

    f["Event"] = text(get(rec, "event"))

    v = need("para", "Para athlete?")
    if v is not None:
        p = yes_no(v)
        if p is None:
            errs.append(f"Para athlete? {v!r} is not Yes or No")
        f["IsPara"] = p

    v = need("target_games", "Target games")
    if v is not None:
        t = ref.target_games.get(norm(v))
        if not t:
            errs.append(f"Target games {v!r} is not one of {', '.join(TARGET_GAMES)}")
        f["TargetGames"] = t

    v = need("date_added", "Date added to follow-up")
    f["DateAdded"] = None
    if v is not None:
        try:
            f["DateAdded"] = to_date(v)
            if f["DateAdded"] > today:
                warns.append(f"Date added {f['DateAdded']:%d/%m/%Y} is in the future")
        except ValueError as e:
            errs.append(f"Date added: {e}")

    attended = get(rec, "camp_attended")
    camp_name = text(get(rec, "camp_name"))
    camp_date = None
    try:
        camp_date = to_date(get(rec, "camp_date"))
    except ValueError as e:
        errs.append(f"Camp date: {e}")
    if not blank(attended) and yes_no(attended) is None:
        errs.append(f"Camp attended {attended!r} is not Yes or No")
    if yes_no(attended) == "No":
        camp_name, camp_date = "", None
    elif yes_no(attended) == "Yes" and (not camp_name or camp_date is None):
        warns.append("camp attended is Yes but camp name or camp date is missing")
    f["CampName"] = camp_name
    f["CampDate"] = camp_date
    f["Notes"] = text(get(rec, "notes"))
    return f, errs, warns


def next_athlete_id(athletes, noc):
    n = 0
    for aid in athletes:
        m = re.fullmatch(rf"ATH-{re.escape(noc)}-(\d+)", aid)
        if m:
            n = max(n, int(m.group(1)))
    return f"ATH-{noc}-{n + 1:03d}"


def process_athletes(wb, ref, athletes, log, log_rows, issues, today):
    sheets = (("dbRaw_Athletes", "Form 1"), ("dbRaw_RosterTemplate", "Roster template"))
    loaded = updated = stopped = skipped = 0
    for sheet, _label in sheets:
        for rownum, rec, raw in read_raw(wb[sheet], ATHLETE_ALIASES):
            h = row_hash(sheet, raw)
            if h in log:
                continue
            req = norm(get(rec, "request") or "new athlete")
            kind = "update" if req.startswith("update") else "stop" if req.startswith("stop") else "new"
            aid = get(rec, "athlete_id")
            aid = str(aid).strip().upper() if not blank(aid) else None
            where = (sheet, rownum)

            def fail(msg, where=where, raw=raw):
                issues.add("ERROR", where[0], where[1], msg, summary(raw))

            def done(note, h=h, where=where):
                log.add(h)
                log_rows.append((h, where[0], where[1], datetime.now(), note))

            if kind == "stop":
                a = athletes.get(aid) if aid else None
                if not aid:
                    fail("Stop request without Athlete ID")
                    continue
                if not a:
                    fail(f"Stop request: athlete {aid} does not exist")
                    continue
                noc = str(get(rec, "noc") or "").strip().upper()
                if noc and noc != a["NOCCode"]:
                    fail(f"Stop request: {aid} belongs to {a['NOCCode']}, not {noc}")
                    continue
                if a["Status"] != "Stopped":
                    when = None
                    try:
                        when = to_date(get(rec, "submitted"))
                    except ValueError:
                        pass
                    a["Status"] = "Stopped"
                    a["StoppedDate"] = when or today
                    stopped += 1
                done("stopped")
                continue

            f, errs, warns = parse_athlete_fields(rec, ref, today)
            if errs:
                fail("; ".join(errs))
                continue
            for w in warns:
                issues.add("WARNING", sheet, rownum, w, summary(raw))
            full = f"{f['FirstName']} {f['FamilyName']}"
            key = ath_key(f["NOCCode"], f["FirstName"], f["FamilyName"], f["DateOfBirth"])
            same_key = [x for x in athletes.values()
                        if ath_key(x["NOCCode"], x["FirstName"], x["FamilyName"], x["DateOfBirth"]) == key]

            if kind == "update":
                a = athletes.get(aid) if aid else None
                if not aid:
                    fail("Update request without Athlete ID")
                    continue
                if not a:
                    fail(f"Update request: athlete {aid} does not exist")
                    continue
                if a["NOCCode"] != f["NOCCode"]:
                    fail(f"Update request: {aid} belongs to {a['NOCCode']}, not {f['NOCCode']}")
                    continue
                if any(x["AthleteID"] != aid for x in same_key):
                    fail(f"Update request: another athlete already has {full} with that date of birth")
                    continue
                for col in ("MethodologistID", "FirstName", "FamilyName", "Gender", "DateOfBirth", "SportID",
                            "DisciplineID", "Event", "IsPara", "TargetGames", "DateAdded", "CampName", "CampDate", "Notes"):
                    a[col] = f[col]
                a["FullName"] = full
                updated += 1
                done("updated")
                continue

            # New athlete (or a roster row).
            if aid and aid in athletes:
                done("already registered (same ID)")
                skipped += 1
                continue
            if aid and aid not in athletes:
                fail(f"Athlete ID {aid} given on a New athlete row but it does not exist; leave the ID blank")
                continue
            if same_key:
                done("already registered")
                issues.add("INFO", sheet, rownum, f"{full} is already registered as {same_key[0]['AthleteID']}; not added again", summary(raw))
                skipped += 1
                continue
            twins = [x for x in athletes.values() if x["NOCCode"] == f["NOCCode"]
                     and norm(x["FirstName"]) == norm(f["FirstName"]) and norm(x["FamilyName"]) == norm(f["FamilyName"])]
            new_id = next_athlete_id(athletes, f["NOCCode"])
            if twins:
                issues.add("WARNING", sheet, rownum,
                           f"{full}: same name as {twins[0]['AthleteID']} but a different date of birth; loaded as {new_id}. Check it is not a typo",
                           summary(raw))
            athletes[new_id] = {
                "AthleteID": new_id, "NOCCode": f["NOCCode"], "MethodologistID": f["MethodologistID"],
                "FirstName": f["FirstName"], "FamilyName": f["FamilyName"], "FullName": full,
                "Gender": f["Gender"], "DateOfBirth": f["DateOfBirth"], "SportID": f["SportID"],
                "DisciplineID": f["DisciplineID"], "Event": f["Event"], "IsPara": f["IsPara"], "TargetGames": f["TargetGames"],
                "DateAdded": f["DateAdded"], "CampName": f["CampName"], "CampDate": f["CampDate"],
                "Status": "Active", "StoppedDate": None, "Notes": f["Notes"],
            }
            loaded += 1
            done(f"new athlete {new_id}")
    return loaded, updated, stopped, skipped


def process_results(wb, ref, athletes, results, log, log_rows, issues, today):
    sheets = ("dbRaw_Results", "dbRaw_ResultsTemplate")
    loaded = replaced = 0
    for sheet in sheets:
        for rownum, rec, raw in read_raw(wb[sheet], RESULT_ALIASES, RESULT_BLOCK_FIELDS):
            h = row_hash(sheet, raw)
            if h in log:
                continue
            blocks = len(rec.get("athlete_id", []))
            if blocks == 0:
                issues.add("ERROR", sheet, rownum, "row has no Athlete ID", summary(raw))
                continue
            row_ok, entries, row_warnings = True, [], []

            def fail(msg, k):
                label = f" (athlete block {k + 1})" if blocks > 1 else ""
                issues.add("ERROR", sheet, rownum, msg + label, summary(raw))

            # Part A: event data, shared by every athlete block of the row.
            noc = get(rec, "noc")
            noc = str(noc).strip().upper() if not blank(noc) else None
            meth = get(rec, "methodologist")
            event_name = text(get(rec, "event_name"))
            part_a_errs = []
            if not event_name:
                part_a_errs.append("Event name is missing")
            event_date = None
            try:
                event_date = to_date(get(rec, "event_date"))
                if event_date is None:
                    part_a_errs.append("Event date is missing")
                elif event_date > today:
                    part_a_errs.append(f"Event date {event_date:%d/%m/%Y} is in the future")
            except ValueError as e:
                part_a_errs.append(f"Event date: {e}")
            level = get(rec, "event_level")
            level_id = ref.level_id(level) if not blank(level) else None
            if level_id is None:
                part_a_errs.append(f"Event level {level!r} is not one of the levels in dimEventLevel" if not blank(level) else "Event level is missing")
            sport = get(rec, "sport")
            sport_id = discipline_id = None
            if blank(sport):
                part_a_errs.append("Sport is missing")
            else:
                sport_id, discipline_id, sport_err = ref.resolve_sport(sport)
                if sport_err:
                    part_a_errs.append(sport_err)
            m = ref.methodologists.get(norm(meth)) if not blank(meth) else None
            if not blank(meth) and not m:
                part_a_errs.append(f"unknown methodologist {meth!r}")
            if part_a_errs:
                fail("; ".join(part_a_errs), 0)
                continue

            for k in range(blocks):
                id_cells = (get(rec, "athlete_id", k), get(rec, "team_ids", k))
                if all(blank(c) for c in id_cells) and all(
                        blank(get(rec, f, k)) for f in RESULT_BLOCK_FIELDS if f != "add_another"):
                    continue  # empty block
                single, team = split_ids(id_cells[0]), split_ids(id_cells[1])
                ids = list(dict.fromkeys(single + team))
                errs = []
                rt_raw = get(rec, "result_type", k)
                rtype = parse_result_type(rt_raw)
                if rtype is None:
                    errs.append(f"Result type {text(rt_raw)!r} is not Individual or Team")
                if not ids:
                    errs.append("Athlete ID is missing")
                elif rtype == "Individual" and (len(ids) > 1 or team):
                    errs.append("several athlete IDs (or 'Team result: athlete IDs') need Result type = Team")
                missing = [i for i in ids if i not in athletes]
                if len(missing) == 1:
                    errs.append(f"athlete {missing[0]} is not registered (register the athlete first)")
                elif missing:
                    errs.append(f"athletes {', '.join(missing)} are not registered (register them first)")
                for aid in ids:
                    a = athletes.get(aid)
                    if not a:
                        continue
                    if noc and a["NOCCode"] != noc:
                        errs.append(f"{aid} belongs to {a['NOCCode']}, not {noc}")
                    if m and a["NOCCode"] != m[1]:
                        errs.append(f"{aid} belongs to {a['NOCCode']}, but {meth} is assigned to {m[1]}")
                    fam = get(rec, "family_check", k)
                    if len(ids) == 1 and not blank(fam) and norm(fam) != norm(a["FamilyName"]):
                        errs.append(f"family name {text(fam)!r} does not match {aid} ({a['FamilyName']})")
                status_raw = get(rec, "status", k)
                status = ref.statuses.get(norm(status_raw)) if not blank(status_raw) else None
                if status is None:
                    errs.append(f"Result status {status_raw!r} is not one of {', '.join(ref.statuses.values())}" if not blank(status_raw) else "Result status is missing")
                position = participants = None
                try:
                    position = to_int(get(rec, "position", k))
                    participants = to_int(get(rec, "participants", k))
                except ValueError as e:
                    errs.append(str(e))
                if status == "Placed" and not errs:
                    if position is None or participants is None:
                        errs.append("status is Placed but position or number of competitors is missing")
                    elif position < 1:
                        errs.append("position must be 1 or more")
                    elif participants < position:
                        errs.append(f"position {position} is higher than the number of competitors ({participants})")
                if errs:
                    fail("; ".join(dict.fromkeys(errs)), k)
                    row_ok = False
                    continue
                if status != "Placed" and (position is not None or participants is not None):
                    who = ids[0] if len(ids) == 1 else f"athlete block {k + 1}"
                    row_warnings.append(f"{who}: position/competitors ignored because status is {status}")
                    position = participants = None
                for aid in ids:
                    a = athletes[aid]
                    if (a["SportID"], a["DisciplineID"] or None) != (sport_id, discipline_id):
                        row_warnings.append(
                            f"{aid}: result sport ({ref.sport_label(sport_id, discipline_id)}) differs from the athlete's registered sport ({ref.sport_label(a['SportID'], a['DisciplineID'])})")
                    entries.append((aid, status, position, participants, k, rtype))

            if not row_ok:
                continue  # all-or-nothing: the whole row is retried after the fix
            for w in row_warnings:
                issues.add("WARNING", sheet, rownum, w, summary(raw))
            for aid, status, position, participants, k, rtype in entries:
                category = text(get(rec, "category", k))
                key = (aid, norm(event_name), event_date, norm(category))
                same = [r for r in results.values()
                        if (r["AthleteID"], norm(r["EventName"]), r["EventDate"], norm(r["Category"])) == key]
                fields = {
                    "AthleteID": aid, "EventName": event_name, "EventDate": event_date,
                    "EventLevelID": level_id, "SportID": sport_id, "DisciplineID": discipline_id,
                    "Category": category, "ResultType": rtype,
                    "ResultStatus": status, "Position": position, "Participants": participants,
                    "Mark": text(get(rec, "mark", k)),
                    "StandingPct": standing_pct(status, position, participants),
                    "SmallField": small_field(status, participants, ref.threshold),
                    "Notes": text(get(rec, "notes", k)), "LoadedOn": today,
                }
                if same:
                    same[0].update(fields)
                    replaced += 1
                    issues.add("INFO", sheet, rownum, f"{aid}: result for {event_name} {event_date:%d/%m/%Y} already existed; replaced by this row", summary(raw))
                else:
                    n = max([int(r["ResultID"].rsplit("-R", 1)[1]) for r in results.values()
                             if r["AthleteID"] == aid] or [0]) + 1
                    rid = f"{aid}-R{n:03d}"
                    results[rid] = {"ResultID": rid, **fields}
                    loaded += 1
            log.add(h)
            log_rows.append((h, sheet, rownum, datetime.now(), f"{len(entries)} result(s)"))
    return loaded, replaced


def build_json(ref, athletes, results, today):
    def iso(d):
        return d.isoformat() if d else None

    ath = []
    for a in sorted(athletes.values(), key=lambda x: (x["NOCCode"], norm(x["FamilyName"]), norm(x["FirstName"]))):
        ath.append({
            "id": a["AthleteID"], "nocCode": a["NOCCode"], "firstName": a["FirstName"],
            "familyName": a["FamilyName"], "gender": a["Gender"],
            "age": age_on(a["DateOfBirth"], today),
            "sportId": a["SportID"], "disciplineId": a["DisciplineID"] or None, "event": a["Event"] or None,
            "isPara": a["IsPara"] == "Yes", "targetGames": a["TargetGames"],
            "dateAdded": iso(a["DateAdded"]), "campName": a["CampName"] or None,
            "campDate": iso(a["CampDate"]), "status": a["Status"], "stoppedDate": iso(a["StoppedDate"]),
        })
    res = []
    for r in sorted(results.values(), key=lambda x: (x["EventDate"], x["ResultID"])):
        res.append({
            "id": r["ResultID"], "athleteId": r["AthleteID"], "eventName": r["EventName"],
            "eventDate": iso(r["EventDate"]), "eventLevelId": r["EventLevelID"], "sportId": r["SportID"],
            "disciplineId": r["DisciplineID"] or None, "category": r["Category"] or None,
            "eventKey": category_key(r["Category"]), "resultType": r["ResultType"] or "Individual",
            "status": r["ResultStatus"],
            "position": r["Position"], "participants": r["Participants"], "mark": r["Mark"] or None,
            "standingPct": r["StandingPct"], "smallField": r["SmallField"] == "Yes",
        })
    return {
        "asOf": iso(today) if ath else None,
        "smallFieldThreshold": ref.threshold,
        "sports": [{"id": i, "name": n} for i, n in ref.sport_names.items()],
        "disciplines": [{"id": r["DisciplineID"], "sportId": r["SportID"], "name": r["DisciplineName"]}
                        for r in ref.discipline_rows],
        "eventLevels": [{"id": r["EventLevelID"], "name": r["EventLevelName"], "order": r["SortOrder"]}
                        for r in sorted(ref.level_rows, key=lambda x: x["SortOrder"])],
        "athletes": ath,
        "results": res,
    }


def save_workbook(wb, path, ref, athletes, results, log_rows, issues):
    def sort_ath(a):
        m = re.fullmatch(r"ATH-(\w+)-(\d+)", a["AthleteID"])
        return (m.group(1), int(m.group(2)))

    ws = replace_sheet(wb, "factAthletes")
    write_table(ws, ATHLETE_COLS, [[a.get(c) for c in ATHLETE_COLS] for a in sorted(athletes.values(), key=sort_ath)],
                widths={"FullName": 26, "Event": 24, "Notes": 40, "CampName": 24}, date_cols=DATE_COLS)
    ws = replace_sheet(wb, "factResults")
    write_table(ws, RESULT_COLS, [[r.get(c) for c in RESULT_COLS] for r in
                                  sorted(results.values(), key=lambda x: (x["AthleteID"], x["EventDate"], x["ResultID"]))],
                widths={"EventName": 30, "Category": 22, "Notes": 40}, date_cols=DATE_COLS)
    write_option_sheet(wb, ref.options)
    ws = replace_sheet(wb, "loadLog")
    write_table(ws, ["RowHash", "Sheet", "Row", "ProcessedOn", "Note"], log_rows)
    for r in range(2, len(log_rows) + 2):
        ws.cell(r, 4).number_format = "dd/mm/yyyy hh:mm"
    ws = replace_sheet(wb, "loadIssues")
    write_table(ws, ["Level", "Sheet", "Row", "Message", "Raw values"],
                [list(i[:4]) + [i[4]] for i in issues.items], widths={"Message": 90, "Raw values": 70})
    wb.save(path)


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    ap = argparse.ArgumentParser(description="Load athlete registrations and results.")
    ap.add_argument("--xlsx", default=DEFAULT_XLSX)
    ap.add_argument("--out-xlsx")
    ap.add_argument("--out-json", default=str(DEFAULT_JSON))
    ap.add_argument("--as-of")
    ap.add_argument("--init", action="store_true", help="create an empty PS_Athletes_Data workbook")
    ap.add_argument("--migrate-sport-tables", action="store_true",
                    help="one-off: convert an empty workbook with the flat dimSports to dimSports + dimDisciplines")
    ap.add_argument("--dry-run", action="store_true", help="validate and report, write nothing")
    args = ap.parse_args()

    xlsx = Path(args.xlsx)
    if args.init:
        if xlsx.exists():
            sys.exit(f"{xlsx} already exists; --init does not overwrite it.")
        init_workbook(xlsx)
        print(f"Created {xlsx}")
        return
    if not xlsx.exists():
        sys.exit(f"{xlsx} not found. Run with --init to create it, or pass --xlsx.")
    if args.migrate_sport_tables:
        migrate_sport_tables(xlsx)
        print(f"Rewrote dimSports, dimDisciplines and lstSportOptions in {xlsx}")
        return

    today = date.fromisoformat(args.as_of) if args.as_of else date.today()
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    ref = Ref(wb)
    athletes, results, log, log_rows = load_state(wb)
    issues = Issues()

    a_new, a_upd, a_stop, a_skip = process_athletes(wb, ref, athletes, log, log_rows, issues, today)
    r_new, r_rep = process_results(wb, ref, athletes, results, log, log_rows, issues, today)

    for lvl, sheet, row, msg, _hint in issues.items:
        print(f"{lvl:7} {sheet} row {row}: {msg}")
    print(f"\nAthletes: {a_new} new, {a_upd} updated, {a_stop} stopped, {a_skip} already registered "
          f"-> {len(athletes)} in total ({sum(1 for a in athletes.values() if a['Status'] == 'Active')} active)")
    print(f"Results:  {r_new} new, {r_rep} replaced -> {len(results)} in total")
    print(f"Issues:   {issues.count('ERROR')} errors (rows not loaded), {issues.count('WARNING')} warnings, {issues.count('INFO')} notes")

    if args.dry_run:
        print("Dry run: nothing written.")
        return
    out_xlsx = Path(args.out_xlsx) if args.out_xlsx else xlsx
    wb_w = openpyxl.load_workbook(xlsx)  # keep formatting of the sheets we do not rewrite
    save_workbook(wb_w, out_xlsx, ref, athletes, results, log_rows, issues)
    out_json = Path(args.out_json)
    data = build_json(ref, athletes, results, today)
    with open(out_json, "w", encoding="utf-8", newline="\r\n") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print(f"Wrote {out_xlsx}\nWrote {out_json}")


if __name__ == "__main__":
    main()

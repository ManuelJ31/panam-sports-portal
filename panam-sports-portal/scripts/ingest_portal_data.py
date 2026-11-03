# -*- coding: utf-8 -*-
"""Rebuild data/reports.json from PS_Portal_Data.xlsx (weekly ingestion).

Usage (from panam-sports-portal/):
    python scripts/ingest_portal_data.py [PS_Portal_Data.xlsx] [reports.json] [output.json]

Defaults: the OneDrive PS_Portal_Data.xlsx, data/reports.json as input, and
the same file as output. Pass a copy of the workbook if Excel has it open.

What it does, and what it deliberately keeps:
  * Every report, objective, activity, initiative, stakeholder and support
    need comes from the workbook; reports.json is regenerated from it.
  * The "nocs" list is NOT rebuilt: existing records (name, flagCode,
    nocGroup, programGroup) are kept, including NOCs with no reports yet.
    A NOC that has reports but is missing from reports.json stops the run.
  * Exact duplicate rows (same id, same content) are dropped; the same id
    with different content stops the run.
  * The "dim" sheet is read by fixed column letters. If a dim table reads as
    empty the run stops: columns moved (as when ProgramGroup was added to
    dimNOC, which shifted every table to its right by one).

Afterwards: npm run generate:pdfs -- <new report ids>, npm run lint, commit.
"""
import json
import openpyxl
from datetime import datetime, date

import sys
from pathlib import Path

args = sys.argv[1:]
PORTAL_ROOT = Path(__file__).resolve().parent.parent
XLSX = args[0] if len(args) > 0 else r"C:\Users\manue\OneDrive\SPORTINXL\Projects\PS_Portal_Data.xlsx"
REPORTS_JSON = args[1] if len(args) > 1 else str(PORTAL_ROOT / "data" / "reports.json")
OUT_JSON = args[2] if len(args) > 2 else REPORTS_JSON

wb = openpyxl.load_workbook(XLSX, data_only=True)


def iso(v):
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    return str(v).strip()


def rows(sheet, cols, start_col_letter):
    ws = wb["dim"]
    start_idx = openpyxl.utils.column_index_from_string(start_col_letter)
    out = []
    r = 2
    while True:
        vals = [ws.cell(row=r, column=start_idx + i).value for i in range(len(cols))]
        if all(v is None for v in vals):
            break
        out.append(dict(zip(cols, vals)))
        r += 1
    return out


def index_by(records, key):
    return {rec[key]: rec for rec in records if rec.get(key) is not None}


methodologists = index_by(
    rows(
        "dim",
        ["MethodologistID", "FirstName", "LastName", "FullName", "NationalityCode",
         "ResidenceCode", "AssignedNOC", "Email", "Region", "ActiveStatus",
         "PrimarySpecialization", "SecondarySpecialization", "YearsExperience"],
        "C",
    ),
    "MethodologistID",
)
weeks = index_by(
    rows("dim", ["WeekID", "StartWeek", "EndWeek", "WeekPeriod", "WeekNumber", "MonthID", "Quarter", "Year", "PhaseID"], "R"),
    "WeekID",
)
phases = index_by(
    rows("dim", ["PhaseID", "PhaseName", "StartDate", "EndDate", "Description"], "AC"),
    "PhaseID",
)
nocs_dim = index_by(
    rows("dim", ["NOCCode", "NOCName", "NocGroupID", "Country", "Language", "ActiveStatus", "ProgramGroup"], "AJ"),
    "NOCCode",
)
noc_groups = index_by(
    rows("dim", ["NocGroupID", "NocGroup", "Description"], "AS"),
    "NocGroupID",
)
initiatives_dim = index_by(
    rows("dim", ["InitiativeID", "InitiativeName", "InitiativeCategoryID", "InitiativeStatusID",
                 "NOCCode", "CreatedDate", "ExpectedEndDate", "ExpectedDeliverable", "SuccessKPI"], "AX"),
    "InitiativeID",
)
initiative_categories = index_by(
    rows("dim", ["InitiativeCategoryID", "InitiativeCategory", "Description", "DisplayOrder"], "BI"),
    "InitiativeCategoryID",
)
initiative_progress_status = index_by(
    rows("dim", ["InitiativeProgressStatusID", "InitiativeProgressStatus", "DisplayOrder", "Color", "isClosed"], "BO"),
    "InitiativeProgressStatusID",
)
activity_categories = index_by(
    rows("dim", ["ActivityCategoryID", "ActivityCategory", "DisplayOrder"], "CA"),
    "ActivityCategoryID",
)
activity_status = index_by(
    rows("dim", ["ActivityStatusID", "ActivityStatus", "DisplayOrder"], "CF"),
    "ActivityStatusID",
)
stakeholders_dim = index_by(
    rows("dim", ["StakeholderID", "Stakeholder", "DisplayOrder"], "CK"),
    "StakeholderID",
)
stakeholder_types = index_by(
    rows("dim", ["StakeholderTypeID", "StakeholderType", "StakeholderLevelID", "DisplayOrder"], "CP"),
    "StakeholderTypeID",
)
stakeholder_levels = index_by(
    rows("dim", ["StakeholderLevelID", "StakeholderLevel", "Description", "DisplayOrder"], "CV"),
    "StakeholderLevelID",
)
challenge_categories = index_by(
    rows("dim", ["ChallengeCategoryID", "ChallengeCategory", "Description"], "DB"),
    "ChallengeCategoryID",
)
challenge_status = index_by(
    rows("dim", ["ChallengeStatusID", "ChallengeStatus", "DisplayOrder"], "DG"),
    "ChallengeStatusID",
)
priority_levels = index_by(
    rows("dim", ["PriorityLevelID", "PriorityLevel", "DisplayOrder", "Color"], "DL"),
    "PriorityLevelID",
)
report_status = index_by(
    rows("dim", ["ReportStatusID", "ReportStatus", "DisplayOrder", "Color", "IsFinal"], "DR"),
    "ReportStatusID",
)

dim_counts = {
    "methodologists": len(methodologists), "weeks": len(weeks), "phases": len(phases),
    "nocs_dim": len(nocs_dim), "noc_groups": len(noc_groups), "initiatives_dim": len(initiatives_dim),
    "initiative_categories": len(initiative_categories), "initiative_progress_status": len(initiative_progress_status),
    "activity_categories": len(activity_categories), "activity_status": len(activity_status),
    "stakeholders_dim": len(stakeholders_dim), "stakeholder_types": len(stakeholder_types),
    "stakeholder_levels": len(stakeholder_levels), "challenge_categories": len(challenge_categories),
    "challenge_status": len(challenge_status), "priority_levels": len(priority_levels),
    "report_status": len(report_status),
}
print("dim counts:", dim_counts)
empty = [k for k, v in dim_counts.items() if v == 0]
if empty:
    raise SystemExit(f"dim tables read as empty (column layout changed again?): {empty}")


def sheet_rows(name):
    ws = wb[name]
    headers = [c.value for c in ws[1]]
    idx = {h: i for i, h in enumerate(headers)}
    out = []
    seen = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row[idx[headers[0]]] is None:
            continue
        rec = {h: row[idx[h]] for h in headers}
        key = rec[headers[0]]
        if key in seen:
            if seen[key] != rec:
                raise SystemExit(f"{name}: id {key} appears twice with different content")
            print(f"NOTE {name}: dropped exact duplicate row {key}")
            continue
        seen[key] = rec
        out.append(rec)
    return out


reports_rows = sheet_rows("Reports")
objectives_rows = sheet_rows("Objectives")
activities_rows = sheet_rows("Activities")
initiatives_rows = sheet_rows("Initiatives")
engagement_rows = sheet_rows("StakeholderEngagement")
support_rows = sheet_rows("SupportNeeds")

print("fact counts:", {
    "reports": len(reports_rows), "objectives": len(objectives_rows), "activities": len(activities_rows),
    "initiatives": len(initiatives_rows), "engagement": len(engagement_rows), "support": len(support_rows),
})

from collections import defaultdict

obj_by_report = defaultdict(list)
for r in objectives_rows:
    obj_by_report[r["ReportID"]].append(r)

act_by_report = defaultdict(list)
for r in activities_rows:
    act_by_report[r["ReportID"]].append(r)

ini_by_report = defaultdict(list)
for r in initiatives_rows:
    ini_by_report[r["ReportID"]].append(r)

eng_by_report = defaultdict(list)
for r in engagement_rows:
    eng_by_report[r["ReportID"]].append(r)

sup_by_report = defaultdict(list)
for r in support_rows:
    sup_by_report[r["ReportID"]].append(r)


def report_sort_key(r):
    wk = weeks.get(r["WeekID"], {})
    return (wk.get("Year") or 0, wk.get("WeekNumber") or 0)


reports_rows.sort(key=report_sort_key)

last_progress = {}

out_reports = []
for r in reports_rows:
    rid = r["ReportID"]
    noc_code = r["NOCCode"]
    wk = weeks.get(r["WeekID"], {})
    phase = phases.get(wk.get("PhaseID"), {})
    meth = methodologists.get(r["MethodologistID"], {})
    status = report_status.get(r["ReportStatusID"], {}).get("ReportStatus", "Draft")

    objectives = [
        {
            "priority": o["PriorityNo"],
            "objective": o["Objective"],
            "expectedResult": o["ExpectedResult"],
            "successIndicator": o["SuccessIndicator"],
        }
        for o in sorted(obj_by_report.get(rid, []), key=lambda x: x["PriorityNo"] or 0)
    ]

    initiatives = []
    for ini in ini_by_report.get(rid, []):
        idim = initiatives_dim.get(ini["InitiativeID"], {})
        cat = initiative_categories.get(idim.get("InitiativeCategoryID"), {}).get("InitiativeCategory", "")
        pstatus = initiative_progress_status.get(ini["InitiativeProgressStatusID"], {}).get("InitiativeProgressStatus", "In Progress")
        key = (noc_code, ini["InitiativeID"])
        prev = last_progress.get(key)
        initiatives.append({
            "id": ini["InitiativeID"],
            "name": idim.get("InitiativeName", ""),
            "category": cat,
            "weeklyProgress": ini["WeeklyProgress"],
            "previousWeeklyProgress": prev,
            "status": pstatus,
            "briefUpdate": ini["BriefUpdate"] or "",
        })
        last_progress[key] = ini["WeeklyProgress"]

    challenges = []
    for c in sup_by_report.get(rid, []):
        challenges.append({
            "category": challenge_categories.get(c["ChallengeCategoryID"], {}).get("ChallengeCategory", ""),
            "description": c["ChallengeDescription"] or "",
            "status": challenge_status.get(c["ChallengeStatusID"], {}).get("ChallengeStatus", ""),
            "actionNeeded": c["ActionNeeded"] or "",
            "priority": priority_levels.get(c["PriorityLevelID"], {}).get("PriorityLevel", ""),
        })

    activities = []
    for a in sorted(act_by_report.get(rid, []), key=lambda x: (x["ActivityDate"] or "", x["ActivityNo"] or 0)):
        activities.append({
            "date": iso(a["ActivityDate"]),
            "description": a["ActivityDescription"] or "",
            "category": activity_categories.get(a["ActivityCategoryID"], {}).get("ActivityCategory", ""),
            "stakeholder": stakeholders_dim.get(a["StakeholderID"], {}).get("Stakeholder", ""),
            "resultProgress": a["ResultProgress"] or "",
            "status": activity_status.get(a["ActivityStatusID"], {}).get("ActivityStatus", ""),
        })

    engagements = []
    for e in eng_by_report.get(rid, []):
        stype = stakeholder_types.get(e["StakeholderTypeID"], {})
        engagements.append({
            "type": stype.get("StakeholderType", ""),
            "level": stakeholder_levels.get(stype.get("StakeholderLevelID"), {}).get("StakeholderLevel", ""),
            "name": e["StakeholderName"] or "",
            "role": e["PositionRole"] or "",
        })

    out_reports.append({
        "id": rid,
        "nocCode": noc_code,
        "year": wk.get("Year"),
        "week": f"W{int(wk.get('WeekNumber')):02d}" if wk.get("WeekNumber") is not None else None,
        "weekNumber": wk.get("WeekNumber"),
        "weekStartDate": iso(wk.get("StartWeek")),
        "weekEndDate": iso(wk.get("EndWeek")),
        "methodologist": meth.get("FullName", ""),
        "methodologistPrimarySpecialization": meth.get("PrimarySpecialization"),
        "methodologistSecondarySpecialization": meth.get("SecondarySpecialization"),
        "submissionDate": iso(r["SubmissionDate"]),
        "status": status,
        "dashboardPdf": f"/dashboards/{rid}.pdf",
        "phaseName": phase.get("PhaseName"),
        "phaseStartDate": iso(phase.get("StartDate")),
        "phaseEndDate": iso(phase.get("EndDate")),
        "executiveSummary": r["ExecutiveSummary"] or "",
        "supportNeeded": r["PanamSupportNeeded"] or "",
        "nextWeekFocus": r["NextWeekFocus"] or "",
        "objectives": objectives,
        "initiatives": initiatives,
        "challenges": challenges,
        "activities": activities,
        "stakeholderEngagements": engagements,
    })

out_reports.sort(key=lambda r: r["id"])

existing = json.load(open(REPORTS_JSON, encoding="utf-8"))
existing_nocs = {n["code"]: n for n in existing["nocs"]}

out_nocs = [dict(n) for n in existing["nocs"]]
known = {n["code"] for n in out_nocs}
unknown = sorted({r["nocCode"] for r in out_reports} - known)
if unknown:
    raise SystemExit(f"NOC(s) in reports but not in reports.json nocs (need name/flag/programGroup): {unknown}")
for n in out_nocs:
    dim_pg = nocs_dim.get(n["code"], {}).get("ProgramGroup")
    if dim_pg != n["programGroup"]:
        print("NOTE programGroup differs from dim for", n["code"], n["programGroup"], "vs", dim_pg)
    dim_group = noc_groups.get(nocs_dim.get(n["code"], {}).get("NocGroupID"), {}).get("NocGroup")
    if dim_group and dim_group != n["nocGroup"]:
        print("NOTE nocGroup differs from dim for", n["code"], n["nocGroup"], "vs", dim_group)

result = {"nocs": out_nocs, "reports": out_reports}
with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)
    f.write("\n")

print("Wrote", len(out_reports), "reports and", len(out_nocs), "nocs to", OUT_JSON)

# ---- duplicate initiative check ----
dupes = []
for r in out_reports:
    ids = [i["id"] for i in r["initiatives"]]
    seen = set()
    for i in ids:
        if i in seen:
            dupes.append((r["id"], i))
        seen.add(i)
if dupes:
    print("WARNING: duplicate initiative ids within a report:", dupes)
else:
    print("No duplicate initiative ids found.")

# -*- coding: utf-8 -*-
"""Build one follow-up Excel per methodologist from PS_Athletes_Data.xlsx.

Methodologists have no portal access, so this is how each of them sees their
own athletes, the athlete IDs they need for the results form, and how each
athlete is evolving.

Usage (from panam-sports-portal/):
    python scripts/methodologist_workbooks.py [--xlsx PATH] [--out-dir DIR] [--as-of YYYY-MM-DD]

Run scripts/load_athletes.py first: this script only reads the normalized
tables (factAthletes, factResults) and the dim sheets.

Each file has: Leer primero, Mis atletas, Resultados, Evolución, Gráficos,
Pendientes. Values are a snapshot as of the date in "Leer primero".
"""
import argparse
import sys
from datetime import date
from pathlib import Path

import openpyxl
from openpyxl.chart import LineChart, Reference
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from load_athletes import DEFAULT_XLSX, age_on, category_key, sheet_dicts, to_date

NAVY = "1E3058"
HEAD_FILL = PatternFill("solid", fgColor=NAVY)
HEAD_FONT = Font(name="Arial", bold=True, color="FFFFFF", size=10)
BODY = Font(name="Arial", size=10)
BOLD = Font(name="Arial", size=10, bold=True)
SMALL_FILL = PatternFill("solid", fgColor="F3EEDD")
FLAG = "★"  # black star: small field


def header(ws, row, labels, widths):
    for c, (label, w) in enumerate(zip(labels, widths), 1):
        cell = ws.cell(row, c, label)
        cell.font = HEAD_FONT
        cell.fill = HEAD_FILL
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(c)].width = w
    ws.row_dimensions[row].height = 30


def body(ws, row, values, date_cols=(), fill=None):
    for c, v in enumerate(values, 1):
        cell = ws.cell(row, c, v)
        cell.font = BODY
        if c in date_cols and v is not None:
            cell.number_format = "dd/mm/yyyy"
        if fill:
            cell.fill = fill


def series_of(results):
    """One athlete's results -> series by (type, event). Only results with a position count.

    Returns [{"label", "type", "points": [...]}], longest first (then most recent).
    """
    groups = {}
    for r in results:
        if r["StandingPct"] is None:
            continue
        key = (r.get("ResultType") or "Individual", category_key(r["Category"]))
        groups.setdefault(key, []).append(r)
    out = []
    for (rtype, _k), pts in groups.items():
        pts.sort(key=lambda r: (r["EventDate"], r["ResultID"]))
        label = pts[-1]["Category"] or "General"
        out.append({"label": label, "type": rtype, "points": pts})
    out.sort(key=lambda g: (-len(g["points"]), g["type"] == "Team", -g["points"][-1]["EventDate"].toordinal()))
    return out


def fmt_date(d):
    return d.strftime("%d/%m/%Y") if d else ""


def build_one(meth, noc, athletes, results, sports, disciplines, levels, today, pending_days, out_path):
    wb = openpyxl.Workbook()

    # ---- Leer primero
    ws = wb.active
    ws.title = "Leer primero"
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 3
    ws.column_dimensions["B"].width = 24
    ws.column_dimensions["C"].width = 100
    ws["B2"] = f"Seguimiento de atletas: {meth['FullName']} ({noc})"
    ws["B2"].font = Font(name="Arial", size=14, bold=True, color=NAVY)
    ws["B3"] = f"Datos al {fmt_date(today)}. Es una copia: no se edita aquí; los cambios se envían con los formularios."
    ws["B3"].font = Font(name="Arial", size=10, color="555B73")
    info = [
        ("Mis atletas", "Tus atletas con su ID. El ID (ATH-XXX-nnn) es lo que escribes en el Formulario 2 para registrar un resultado."),
        ("Resultados", f"Todos los resultados registrados. {FLAG} = campo pequeño (menos competidores que el umbral): la posición relativa de esos resultados dice menos."),
        ("Evolución", "Por atleta y por evento (Category): primera y última posición relativa, cambio y mejor resultado. "
                      "Eventos distintos (100 m, 200 m) no se mezclan, y los resultados de equipo (relevos, deportes de conjunto) van aparte, con Type = Team."),
        ("Gráficos", "Línea de posición relativa por competencia, un gráfico por evento, para series con al menos dos resultados con posición."),
        ("Pendientes", f"Atletas activos sin ningún resultado, o sin resultado en los últimos {pending_days} dias."),
        ("Posición relativa", "Va de 0 a 100: 100 = primer lugar, 0 = ultimo lugar. Formula: (competidores - posicion) / (competidores - 1) x 100. "
                              "Solo se calcula con estado Placed y al menos 2 competidores. Permite comparar un 5.º de 8 con un 5.º de 80."),
        ("Niveles de evento", "No compares posiciones de niveles distintos sin mirar el nivel: un 3.º en un nacional no es igual a un 3.º en un continental."),
    ]
    for i, (a, b) in enumerate(info, 5):
        ws.cell(i, 2, a).font = BOLD
        c = ws.cell(i, 3, b)
        c.font = BODY
        c.alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[i].height = 28

    by_ath = {}
    for r in results:
        by_ath.setdefault(r["AthleteID"], []).append(r)
    for lst in by_ath.values():
        lst.sort(key=lambda r: (r["EventDate"], r["ResultID"]))

    def full(a):
        return f"{a['FirstName']} {a['FamilyName']}"

    def sport_of(a):
        sport = sports.get(a["SportID"], a["SportID"])
        disc = disciplines.get(a["DisciplineID"])
        return f"{sport} - {disc}" if disc else sport

    # ---- Mis atletas
    ws = wb.create_sheet("Mis atletas")
    cols = ["Athlete ID", "First name", "Family name", "Gender", "Date of birth", "Age", "Sport", "Discipline", "Event",
            "Para", "Target games", "Date added", "Status", "Results", "Last event", "Days since last event"]
    header(ws, 1, cols, [14, 16, 20, 9, 13, 6, 22, 22, 22, 6, 12, 12, 10, 9, 12, 12])
    for r, a in enumerate(athletes, 2):
        res = by_ath.get(a["AthleteID"], [])
        last = res[-1]["EventDate"] if res else None
        body(ws, r, [a["AthleteID"], a["FirstName"], a["FamilyName"], a["Gender"], a["DateOfBirth"],
                     age_on(a["DateOfBirth"], today), sports.get(a["SportID"], a["SportID"]),
                     disciplines.get(a["DisciplineID"]), a["Event"],
                     a["IsPara"], a["TargetGames"], a["DateAdded"], a["Status"], len(res), last,
                     (today - last).days if last else None], date_cols=(5, 12, 15))
    ws.freeze_panes = "B2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(cols))}{len(athletes) + 1}"

    # ---- Resultados
    ws = wb.create_sheet("Resultados")
    cols = ["Athlete ID", "Athlete", "Event date", "Event", "Level", "Category", "Type", "Status", "Position",
            "Competitors", "Relative position (0-100)", FLAG, "Mark or time", "Notes"]
    header(ws, 1, cols, [14, 24, 12, 30, 22, 20, 11, 9, 9, 11, 14, 5, 14, 36])
    names = {a["AthleteID"]: full(a) for a in athletes}
    rows = [r for a in athletes for r in by_ath.get(a["AthleteID"], [])]
    for i, r in enumerate(rows, 2):
        small = r["SmallField"] == "Yes"
        body(ws, i, [r["AthleteID"], names[r["AthleteID"]], r["EventDate"], r["EventName"],
                     levels.get(r["EventLevelID"], r["EventLevelID"]), r["Category"], r.get("ResultType") or "Individual",
                     r["ResultStatus"], r["Position"], r["Participants"], r["StandingPct"], FLAG if small else None,
                     r["Mark"], r["Notes"]],
             date_cols=(3,), fill=SMALL_FILL if small else None)
        ws.cell(i, 11).number_format = "0.0"
    ws.freeze_panes = "C2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(cols))}{max(len(rows), 1) + 1}"

    # ---- Evolución (one row per athlete and event: results of different events are not mixed)
    ws = wb.create_sheet("Evolución")
    cols = ["Athlete ID", "Athlete", "Sport", "Event (category)", "Type", "Results with position", "First (0-100)",
            "Latest (0-100)", "Change", "Best (0-100)", "Small-field results"]
    header(ws, 1, cols, [14, 24, 34, 24, 11, 12, 12, 12, 10, 12, 12])
    i = 2
    all_series = {}
    for a in athletes:
        res = by_ath.get(a["AthleteID"], [])
        groups = series_of(res)
        all_series[a["AthleteID"]] = groups
        if not groups:
            body(ws, i, [a["AthleteID"], full(a), sport_of(a), None, None, 0])
            i += 1
            continue
        for g in groups:
            pts = [r["StandingPct"] for r in g["points"]]
            change = round(pts[-1] - pts[0], 1) if len(pts) >= 2 else None
            body(ws, i, [a["AthleteID"], full(a), sport_of(a), g["label"], g["type"], len(pts), pts[0], pts[-1],
                         change, max(pts), sum(1 for r in g["points"] if r["SmallField"] == "Yes")])
            for c in (7, 8, 9, 10):
                ws.cell(i, c).number_format = "0.0"
            i += 1
    ws.freeze_panes = "C2"

    # ---- Gráficos
    ws = wb.create_sheet("Gráficos")
    ws.column_dimensions["A"].width = 14
    ws.column_dimensions["B"].width = 34
    ws.column_dimensions["C"].width = 12
    ws["A1"] = "Posición relativa por competencia (100 = primer lugar), un gráfico por atleta y evento. Solo series con 2 o más resultados con posición."
    ws["A1"].font = BOLD
    row = 3
    charts = 0
    for a in athletes:
        for g in all_series.get(a["AthleteID"], []):
            pts = g["points"]
            if len(pts) < 2:
                continue
            tag = " (team)" if g["type"] == "Team" else ""
            ws.cell(row, 1, a["AthleteID"]).font = BOLD
            ws.cell(row, 2, f"{full(a)} - {g['label']}{tag}").font = BOLD
            ws.cell(row + 1, 1, "Date").font = BODY
            ws.cell(row + 1, 2, "Event").font = BODY
            ws.cell(row + 1, 3, "0-100").font = BODY
            for j, r in enumerate(pts, row + 2):
                ws.cell(j, 1, r["EventDate"].strftime("%d/%m/%Y")).font = BODY
                ws.cell(j, 2, r["EventName"] + (f" {FLAG}" if r["SmallField"] == "Yes" else "")).font = BODY
                ws.cell(j, 3, r["StandingPct"]).font = BODY
            first, last = row + 2, row + 1 + len(pts)
            ch = LineChart()
            ch.title = f"{full(a)} ({a['AthleteID']}) - {g['label']}{tag}"
            ch.height, ch.width = 6.5, 15
            ch.y_axis.scaling.min, ch.y_axis.scaling.max = 0, 100
            ch.legend = None
            ch.add_data(Reference(ws, min_col=3, min_row=row + 1, max_row=last), titles_from_data=True)
            ch.set_categories(Reference(ws, min_col=1, min_row=first, max_row=last))
            ch.series[0].marker.symbol = "circle"
            ch.series[0].graphicalProperties.line.solidFill = NAVY
            ch.x_axis.delete = False
            ch.y_axis.delete = False
            ws.add_chart(ch, f"E{row}")
            row += max(len(pts) + 3, 15)
            charts += 1
    if charts == 0:
        ws["A3"] = "Aún no hay series con dos o mas resultados con posicion en el mismo evento."
        ws["A3"].font = BODY

    # ---- Pendientes
    ws = wb.create_sheet("Pendientes")
    cols = ["Athlete ID", "Athlete", "Sport", "Date added", "Last event", "Days since last event", "Reason"]
    header(ws, 1, cols, [14, 24, 34, 12, 12, 14, 40])
    r = 2
    for a in athletes:
        if a["Status"] != "Active":
            continue
        res = by_ath.get(a["AthleteID"], [])
        last = res[-1]["EventDate"] if res else None
        if last is None:
            since = (today - a["DateAdded"]).days
            if since < pending_days:
                continue
            reason = f"No results registered since it was added ({since} days)"
            days = None
        else:
            days = (today - last).days
            if days < pending_days:
                continue
            reason = f"No result in the last {pending_days} days"
        body(ws, r, [a["AthleteID"], full(a), sport_of(a), a["DateAdded"], last, days, reason],
             date_cols=(4, 5))
        r += 1
    if r == 2:
        ws["A2"] = "Ningún atleta pendiente."
        ws["A2"].font = BODY
    ws.freeze_panes = "A2"

    wb.save(out_path)
    return len(athletes), len(rows), charts


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", default=DEFAULT_XLSX)
    ap.add_argument("--out-dir")
    ap.add_argument("--as-of")
    args = ap.parse_args()

    xlsx = Path(args.xlsx)
    if not xlsx.exists():
        sys.exit(f"{xlsx} not found.")
    today = date.fromisoformat(args.as_of) if args.as_of else date.today()
    out_dir = Path(args.out_dir) if args.out_dir else xlsx.parent / "Seguimiento_Metodologos"
    out_dir.mkdir(parents=True, exist_ok=True)

    wb = openpyxl.load_workbook(xlsx, data_only=True)

    def facts(name, date_cols):
        rows = sheet_dicts(wb[name])
        for r in rows:
            for c in date_cols:
                if r.get(c) is not None:
                    r[c] = to_date(r[c])
        return rows

    athletes = facts("factAthletes", ("DateOfBirth", "DateAdded", "CampDate", "StoppedDate"))
    results = facts("factResults", ("EventDate", "LoadedOn"))
    sports = {r["SportID"]: r["SportName"] for r in sheet_dicts(wb["dimSports"])}
    disciplines = {r["DisciplineID"]: r["DisciplineName"] for r in sheet_dicts(wb["dimDisciplines"])}
    levels = {r["EventLevelID"]: r["EventLevelName"] for r in sheet_dicts(wb["dimEventLevel"])}
    settings = {r["Key"]: r["Value"] for r in sheet_dicts(wb["settings"])}
    pending_days = int(settings.get("PendingDays", 90))
    methodologists = sheet_dicts(wb["dimMethodologists"])

    if not athletes:
        print("No athletes registered yet: nothing to build.")
        return
    made = 0
    for m in methodologists:
        mine = [a for a in athletes if a["MethodologistID"] == m["MethodologistID"]]
        if not mine:
            continue
        mine.sort(key=lambda a: (a["FamilyName"].lower(), a["FirstName"].lower()))
        ids = {a["AthleteID"] for a in mine}
        mine_res = [r for r in results if r["AthleteID"] in ids]
        path = out_dir / f"Seguimiento_{m['NOCCode']}_{m['FullName'].replace(' ', '_')}.xlsx"
        n_ath, n_res, n_ch = build_one(m, m["NOCCode"], mine, mine_res, sports, disciplines, levels, today, pending_days, path)
        print(f"{path.name}: {n_ath} athletes, {n_res} results, {n_ch} charts")
        made += 1
    print(f"{made} workbook(s) in {out_dir}")


if __name__ == "__main__":
    main()

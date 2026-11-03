# Panam Sports Executive Monitoring Platform

A clean, elegant portal for Panam Sports and Olympic organization executives to
review weekly Methodologist reports — one page per National Olympic Committee
(NOC), one dossier per week.

Built with Next.js 15 (App Router), React 19, TypeScript, and Tailwind CSS.
No database, no authentication, no admin UI — content is driven entirely by a
JSON file and a folder of static assets, so it deploys to Vercel as-is.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The home page lists every NOC as a card; opening
a card goes to that committee's latest weekly report.

To build for production (this also statically pre-renders every report page):

```bash
npm run build
npm start
```

## Project structure

```
app/
  page.tsx                 Home page — one card per Methodologist Program group
  [group]/page.tsx         /group-1, /group-2 — grid of that group's NOC cards
  report/[id]/page.tsx     Report dossier page (id = "PS-<NOC>-<YEAR>-W<WEEK>")
  layout.tsx, globals.css  Root layout, fonts, Tailwind entry point
  not-found.tsx            Friendly 404 for missing/invalid report ids

components/                Presentational building blocks (CountryCard,
                            DossierHeader, StatusBadge, ReportNav, ...)

lib/
  types.ts                 Noc / MethodologistReport / ReportsData types
  reports.ts                All data access goes through this module
  format.ts                 Date and week-label formatting helpers

data/
  reports.json              Source of truth: NOC list + weekly reports

public/dashboards/          Per-report PDFs, generated with
                             scripts/generate-pdfs.mjs (see below)

scripts/
  ingest_portal_data.py     Rebuilds data/reports.json from PS_Portal_Data.xlsx
  generate-pdfs.mjs         Renders each report page headlessly and prints
                             it to public/dashboards/<id>.pdf
```

## Data model — `data/reports.json`

```jsonc
{
  "nocs": [
    { "code": "DMA", "name": "Dominica", "nocGroup": "Group2", "programGroup": "G1", "flagCode": "dm" }
  ],
  "reports": [
    {
      "id": "PS-DMA-2026-W06",
      "nocCode": "DMA",
      "year": 2026,
      "week": "W06",
      "weekNumber": 6,
      "methodologist": "Valentyna Zolotarova",
      "submissionDate": "2026-02-08",
      "status": "Approved",   // "Draft" | "Submitted" | "Reviewed" | "Approved" | "Returned"
      "dashboardPdf": "/dashboards/PS-DMA-2026-W06.pdf",
      "executiveSummary": "...",
      "supportNeeded": "...",
      "nextWeekFocus": "..."
    }
  ]
}
```

- `nocGroup` is Panam Sports' regional division (dimNOCGroup); `programGroup`
  (`"G1"` or `"G2"`, required) is the Methodologist Program cohort and decides
  which group page a NOC appears on. The build fails if it is missing or invalid.
- `id` is the canonical key and matches the dashboard file names exactly:
  `PS-<NOC code>-<year>-W<week, zero-padded>`.
- The home page shows, per NOC, the report with the highest `(year, weekNumber)`.
- The report page's Previous/Next Week buttons walk the chronological list of
  reports for that NOC (`lib/reports.ts#getAdjacentReports`).

This repo ships with sample reports across the Caribbean NOCs currently
assigned, each paired with its assigned methodologist. Replace them with real
data at any time — no code changes required.

## Adding a new week of reports

1. Load the new reports into `PS_Portal_Data.xlsx`, then rebuild the JSON:
   ```bash
   python scripts/ingest_portal_data.py
   ```
   (Pass a copy of the workbook as the first argument if Excel has it open.)
   It regenerates every report from the workbook, keeps the existing `nocs`
   records, and stops if a NOC with reports is missing from `nocs` — add it
   there first (code, name, `nocGroup`, `programGroup`, `flagCode`). Read the
   `NOTE`/`WARNING` lines it prints; they flag duplicate rows and duplicate
   initiatives in the source data.
2. Generate that report's PDF:
   ```bash
   npm run generate:pdfs -- PS-<NOC>-<YEAR>-W<WEEK>
   ```
   This runs a production build, boots it locally, opens
   `/report/<id>` in a headless browser, and prints it to
   `public/dashboards/<id>.pdf` — the same file the page's "Download PDF"
   button links to. Omit the id to regenerate every report's PDF at once
   (useful after a layout/style change to the report page).

   One-time setup for this script: `npx playwright install chromium`
   (`playwright` itself is already a devDependency, installed by
   `npm install`).

No other changes are required — the home page, report page, and Previous/Next
navigation all pick it up automatically.

## Extending further

All data access is centralized in `lib/reports.ts`. To move off the JSON file
later (a CMS, a database, an internal API), that module is the only place
that needs to change — every page and component consumes its exported
functions, not the JSON file directly.

## Design notes

- **Colors** — the Panam Sports institutional palette: navy `#1E3058`
  (headings, primary buttons), blue `#2D4C8D` (interactive accent), gold
  `#A39161` (secondary accent, used on the week ring and the "Reviewed"
  status), and light gray `#F5F6F8` (page background). Status badges add a
  few semantic colors (green for Approved, red for Returned) since five
  distinct statuses need to stay visually distinguishable at a glance.
- **Typography** — **Montserrat** (via `next/font/google`, self-hosted at
  build time — no runtime request to Google Fonts) for all headings and body
  copy. Small metadata text (the eyebrow labels, dossier meta values, week
  numbers) uses a **Calibri / Aptos** system-font stack instead. Calibri and
  Aptos are Microsoft-licensed fonts that can't be bundled as web fonts, so
  that stack (`Aptos → Calibri → Segoe UI → Arial`) will render as Aptos or
  Calibri on Windows machines that have them installed, and fall back
  gracefully to Segoe UI / Arial everywhere else (Mac, Linux, mobile).
- No sidebar, no persistent nav chrome — just a home grid and a document-style
  report page, in keeping with the brief.
- The small radial "week ring" on each card is the one signature visual
  flourish: an at-a-glance read of how far into the year that NOC's latest
  report falls.

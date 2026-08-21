export function formatWeekLabel(weekNumber: number, year: number): string {
  return `Week ${weekNumber} · ${year}`;
}

export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

/** Compact same-week date range for chart tooltips, e.g. "Jun 22 – 28" or "Jun 29 – Jul 5". */
export function formatWeekPeriod(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const startFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    start
  );
  const endFmt =
    start.getMonth() === end.getMonth()
      ? new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(end)
      : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(end);
  return `${startFmt} – ${endFmt}`;
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const shortFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const longFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return start.getFullYear() === end.getFullYear()
    ? `${shortFmt.format(start)} – ${longFmt.format(end)}`
    : `${longFmt.format(start)} – ${longFmt.format(end)}`;
}

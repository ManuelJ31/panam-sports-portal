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

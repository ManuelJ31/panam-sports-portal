"use client";

import { Fragment, useState } from "react";
import type { AthleteRow } from "@/lib/athletes";
import { formatDate } from "@/lib/format";
import Tag from "@/components/Tag";
import StandingChart, { type StandingPoint } from "@/components/StandingChart";

function toPoint(r: AthleteRow["results"][number]): StandingPoint {
  return {
    date: r.date,
    eventName: r.eventName,
    level: r.level,
    position: r.position!,
    participants: r.participants!,
    standingPct: r.standingPct!,
    smallField: r.smallField,
  };
}

const STATUS_TONE = { Placed: "blue", DNF: "gold", DNS: "gray", DQ: "red" } as const;

function Standing({ pct, small }: { pct: number | null; small: boolean }) {
  if (pct === null) return <span className="text-navy-faint">&mdash;</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-paper-line">
        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-meta text-xs text-navy-soft">{pct.toFixed(1)}</span>
      {small && (
        <span className="text-gold" title="Small field" aria-label="Small field">
          &#9733;
        </span>
      )}
    </div>
  );
}

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-navy-faint">&mdash;</span>;
  const tone =
    value > 0 ? "text-status-approved" : value < 0 ? "text-status-returned" : "text-navy-soft";
  return (
    <span className={`font-meta text-xs font-medium ${tone}`}>
      {value > 0 ? "+" : value < 0 ? "−" : ""}
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

export default function AthleteRoster({
  roster,
  showId,
}: {
  roster: AthleteRow[];
  /** Show the athlete ID under the name (when the label is the name, not the ID). */
  showId: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="eyebrow border-b border-paper-line">
            <th className="py-2 pr-3 font-medium">Athlete</th>
            <th className="py-2 pr-3 font-medium">Age</th>
            <th className="py-2 pr-3 font-medium">Gender</th>
            <th className="py-2 pr-3 font-medium">Sport</th>
            <th className="py-2 pr-3 font-medium">Target</th>
            <th className="py-2 pr-3 font-medium">Results</th>
            <th className="py-2 pr-3 font-medium">Latest (0&ndash;100)</th>
            <th className="py-2 pl-3 font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((a) => {
            const isOpen = openId === a.id;
            const charted = a.series.filter((s) => s.points.length >= 2);
            const toggle = () => setOpenId(isOpen ? null : a.id);

            return (
              <Fragment key={a.id}>
                <tr
                  onClick={toggle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  className={`cursor-pointer border-b border-paper-line/60 transition-colors last:border-0 hover:bg-paper-off ${
                    a.stopped ? "opacity-60" : ""
                  }`}
                >
                  <td className="py-2.5 pr-3 text-navy">
                    <span
                      aria-hidden
                      className={`mr-1.5 inline-block text-navy-faint transition-transform ${isOpen ? "rotate-90" : ""}`}
                    >
                      &rsaquo;
                    </span>
                    {a.label}
                    {a.stopped && (
                      <span className="ml-2">
                        <Tag label="Stopped" tone="gray" />
                      </span>
                    )}
                    {(showId || a.discipline || a.event || a.isPara) && (
                      <p className="ml-4 mt-0.5 font-meta text-xs text-navy-faint">
                        {[showId ? a.id : null, a.discipline, a.event, a.isPara ? "Para" : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-navy-soft">{a.age}</td>
                  <td className="py-2.5 pr-3 text-navy-soft">{a.gender}</td>
                  <td className="py-2.5 pr-3 text-navy-soft">{a.sport}</td>
                  <td className="py-2.5 pr-3 text-navy-soft">{a.targetGames}</td>
                  <td className="py-2.5 pr-3 text-navy-soft">{a.resultCount}</td>
                  <td className="py-2.5 pr-3">
                    {a.latest && a.latest.standingPct === null && a.latest.status !== "Placed" ? (
                      <Tag label={a.latest.status} tone={STATUS_TONE[a.latest.status as keyof typeof STATUS_TONE] ?? "gray"} />
                    ) : (
                      <Standing pct={a.latest?.standingPct ?? null} small={a.latest?.smallField ?? false} />
                    )}
                  </td>
                  <td className="py-2.5 pl-3" title={a.changeLabel ? `Change in ${a.changeLabel}` : undefined}>
                    <Change value={a.change} />
                  </td>
                </tr>

                {isOpen && (
                  <tr className="border-b border-paper-line/60 last:border-0">
                    <td colSpan={8} className="bg-paper-off px-3 py-4">
                      {/* Sticky + viewport-capped so the panel stays in view when the table scrolls sideways. */}
                      <div className="sticky left-0 w-[min(100%,calc(100vw-7.5rem))]">
                      {a.campName && (
                        <p className="mb-3 text-xs text-navy-faint">Panam Sports camp: {a.campName}</p>
                      )}
                      {a.results.length === 0 ? (
                        <p className="text-sm text-navy-soft">No results registered yet.</p>
                      ) : (
                        <>
                          {charted.map((s) => (
                            <div key={s.key} className="mb-4">
                              <p className="eyebrow">
                                Relative position
                                {s.label !== "General" || s.team ? ` · ${s.label}` : ""}
                                {s.team ? " (team)" : ""}
                              </p>
                              <StandingChart points={s.points.map(toPoint)} />
                            </div>
                          ))}
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[560px] text-left text-xs">
                              <thead>
                                <tr className="eyebrow border-b border-paper-line">
                                  <th className="py-1.5 pr-3 font-medium">Date</th>
                                  <th className="py-1.5 pr-3 font-medium">Event</th>
                                  <th className="py-1.5 pr-3 font-medium">Level</th>
                                  <th className="py-1.5 pr-3 font-medium">Result</th>
                                  <th className="py-1.5 pr-3 font-medium">0&ndash;100</th>
                                  <th className="py-1.5 font-medium">Mark</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...a.results].reverse().map((r) => (
                                  <tr key={r.id} className="border-b border-paper-line/60 last:border-0">
                                    <td className="whitespace-nowrap py-1.5 pr-3 text-navy-soft">
                                      {formatDate(r.date)}
                                    </td>
                                    <td className="py-1.5 pr-3 text-navy">
                                      {r.eventName}
                                      {r.category && (
                                        <span className="text-navy-faint"> &middot; {r.category}</span>
                                      )}
                                      {r.team && (
                                        <span className="ml-2">
                                          <Tag label="Team" tone="blue" />
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 pr-3 text-navy-soft">{r.level}</td>
                                    <td className="py-1.5 pr-3 text-navy-soft">
                                      {r.status === "Placed" && r.position !== null
                                        ? `${r.position} of ${r.participants}`
                                        : r.status}
                                    </td>
                                    <td className="py-1.5 pr-3">
                                      <Standing pct={r.standingPct} small={r.smallField} />
                                    </td>
                                    <td className="py-1.5 text-navy-soft">{r.mark ?? "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

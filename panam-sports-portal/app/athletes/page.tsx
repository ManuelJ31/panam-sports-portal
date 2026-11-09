import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Flag, Layers, Medal, Users } from "lucide-react";
import {
  SHOW_ATHLETE_NAMES,
  SMALL_FIELD_THRESHOLD,
  getOverview,
  hasAthleteData,
} from "@/lib/athletes";
import { formatDate } from "@/lib/format";
import KpiTile from "@/components/KpiTile";
import SportGenderTable from "@/components/SportGenderTable";

export const metadata: Metadata = {
  title: "Athlete Tracking · Panam Sports Executive Monitoring Platform",
};

export default function AthletesPage() {
  if (!hasAthleteData()) notFound();
  const o = getOverview();

  return (
    <main className="mx-auto w-full max-w-canvas flex-1 px-6 pb-24 pt-16 sm:px-10 sm:pt-24">
      <Link
        href="/"
        className="eyebrow inline-flex items-center gap-1.5 text-navy-faint transition-colors hover:text-blue-dim"
      >
        <span aria-hidden>&larr;</span> All Groups
      </Link>

      <header className="mb-12 mt-8 max-w-2xl animate-fadeUp sm:mb-16">
        <div className="flex items-center gap-2.5">
          <Image
            src="/brand/panam-sports-mark.png"
            alt="Panam Sports"
            width={608}
            height={608}
            className="h-7 w-7"
            priority
          />
          <p className="eyebrow">Panam Sports &middot; Methodologist Program</p>
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] text-navy sm:text-5xl">
          Athlete Tracking
        </h1>
        <p className="mt-5 text-balance text-base leading-relaxed text-navy-soft sm:text-lg">
          Prioritized athletes and their competition results, as reported by the Methodologists
          {o.asOf ? ` · ages as of ${formatDate(o.asOf)}` : ""}
        </p>
      </header>

      <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Athletes tracked"
          value={o.counts.total}
          caption={`${o.counts.female} female · ${o.counts.male} male${o.stopped ? ` · ${o.stopped} stopped` : ""}`}
          icon={Users}
        />
        <KpiTile label="Sports" value={o.sports} caption="With at least one athlete" icon={Layers} />
        <KpiTile
          label="Results recorded"
          value={o.results}
          caption={`${o.placedResults} with a relative position`}
          icon={Medal}
        />
        <KpiTile label="Committees" value={o.committees} caption="With athletes registered" icon={Flag} />
      </section>

      <section aria-label="By committee" className="mt-14">
        <h2 className="eyebrow">By committee</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-paper-line bg-paper p-5 shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="eyebrow border-b border-paper-line">
                <th className="py-2 pr-3 font-medium">Committee</th>
                <th className="px-2 py-2 text-right font-medium">Athletes</th>
                <th className="px-2 py-2 text-right font-medium">Female</th>
                <th className="px-2 py-2 text-right font-medium">Male</th>
                <th className="px-2 py-2 text-right font-medium">Sports</th>
                <th className="px-2 py-2 text-right font-medium">Results</th>
                <th className="px-2 py-2 font-medium">Last event</th>
                <th className="py-2 pl-2" />
              </tr>
            </thead>
            <tbody>
              {o.byNoc.map((row) => (
                <tr key={row.noc.code} className="border-b border-paper-line/60 last:border-0">
                  <td className="py-2.5 pr-3 text-navy">
                    <span
                      className={`fi fi-${row.noc.flagCode} mr-2.5 rounded align-middle text-xl leading-none shadow-sm`}
                      aria-hidden
                    />
                    {row.noc.name}
                  </td>
                  {row.hasAthletes ? (
                    <>
                      <td className="px-2 py-2.5 text-right font-medium text-navy">{row.counts.total}</td>
                      <td className="px-2 py-2.5 text-right text-navy-soft">{row.counts.female}</td>
                      <td className="px-2 py-2.5 text-right text-navy-soft">{row.counts.male}</td>
                      <td className="px-2 py-2.5 text-right text-navy-soft">{row.sports}</td>
                      <td className="px-2 py-2.5 text-right text-navy-soft">{row.results}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-navy-soft">
                        {row.lastEvent ? formatDate(row.lastEvent) : "—"}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <Link
                          href={`/athletes/${row.noc.code}`}
                          className="text-sm font-medium text-blue transition-colors hover:text-blue-dim"
                        >
                          Open <span aria-hidden>&rarr;</span>
                        </Link>
                      </td>
                    </>
                  ) : (
                    <td colSpan={7} className="px-2 py-2.5 text-navy-faint">
                      No athletes registered yet
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Sports and gender" className="mt-14">
        <h2 className="eyebrow">Target sports by committee and gender</h2>
        <div className="mt-4 rounded-2xl border border-paper-line bg-paper p-5 shadow-card">
          <SportGenderTable
            rows={o.matrix}
            columns={o.matrixNocs.map((n) => ({ code: n.code, name: n.name }))}
          />
          <p className="mt-4 text-xs text-navy-faint">
            Active athletes only. &ldquo;Para&rdquo; counts the para athletes among them.
          </p>
        </div>
      </section>

      {o.targetGames.length > 0 && (
        <section aria-label="Target games" className="mt-14">
          <h2 className="eyebrow">Target games</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {o.targetGames.map((g) => (
              <div key={g.label} className="rounded-xl border border-paper-line bg-paper px-5 py-3">
                <p className="eyebrow">{g.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold text-navy">{g.count}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-label="How to read this" className="mt-14 max-w-prose border-t border-paper-line pt-6">
        <h2 className="eyebrow">How to read this</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-navy-soft">
          <li>
            All data is reported by the Methodologists; it has not been verified against official
            results.
          </li>
          <li>
            Relative position runs from 0 to 100 (100 = first place, 0 = last place), so a 5th of 8
            can be compared with a 5th of 80. It is only calculated for finished results with at
            least 2 competitors.
          </li>
          <li>
            A star (&#9733;) marks a small field: fewer than {SMALL_FIELD_THRESHOLD} competitors, where
            the position says less.
          </li>
          {!SHOW_ATHLETE_NAMES && <li>Athlete names are hidden; athletes are identified by ID.</li>}
        </ul>
      </section>
    </main>
  );
}

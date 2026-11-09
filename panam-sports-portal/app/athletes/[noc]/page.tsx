import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Layers, Medal, Users } from "lucide-react";
import {
  SHOW_ATHLETE_NAMES,
  SMALL_FIELD_THRESHOLD,
  getAthleteNocCodes,
  getNocAthleteView,
} from "@/lib/athletes";
import { getLatestReportForNoc, getNoc } from "@/lib/reports";
import { formatDate } from "@/lib/format";
import AthleteRoster from "@/components/AthleteRoster";
import KpiTile from "@/components/KpiTile";
import SportGenderTable from "@/components/SportGenderTable";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAthleteNocCodes().map((noc) => ({ noc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ noc: string }>;
}): Promise<Metadata> {
  const { noc } = await params;
  const info = getNoc(noc);
  if (!info) return { title: "Committee not found" };
  return { title: `${info.name} athletes · Panam Sports Executive Monitoring Platform` };
}

export default async function NocAthletesPage({
  params,
}: {
  params: Promise<{ noc: string }>;
}) {
  const { noc: code } = await params;
  const view = getNocAthleteView(code);
  if (!view) notFound();

  const { noc } = view;
  const latestReport = getLatestReportForNoc(noc.code);

  return (
    <main className="mx-auto w-full max-w-canvas flex-1 px-6 pb-24 pt-10 sm:px-10 sm:pt-14">
      <Link
        href="/athletes"
        className="eyebrow inline-flex items-center gap-1.5 text-navy-faint transition-colors hover:text-blue-dim"
      >
        <span aria-hidden>&larr;</span> Athlete Tracking
      </Link>

      <header className="mb-10 mt-8 animate-fadeUp">
        <div className="flex items-center gap-2.5">
          <Image
            src="/brand/panam-sports-mark.png"
            alt="Panam Sports"
            width={608}
            height={608}
            className="h-7 w-7"
            priority
          />
          <p className="eyebrow">Panam Sports &middot; Athlete Tracking</p>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className={`fi fi-${noc.flagCode} rounded text-5xl leading-none shadow-sm`} aria-hidden />
          <h1 className="font-display text-3xl font-semibold leading-tight text-navy sm:text-4xl">
            {noc.name}
          </h1>
        </div>
        <p className="mt-4 text-sm text-navy-soft">
          {view.asOf ? `Ages as of ${formatDate(view.asOf)}. ` : ""}
          {latestReport && (
            <Link
              href={`/report/${latestReport.id}`}
              className="font-medium text-blue transition-colors hover:text-blue-dim"
            >
              Latest weekly report <span aria-hidden>&rarr;</span>
            </Link>
          )}
        </p>
      </header>

      <section aria-label="Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile
          label="Athletes tracked"
          value={view.counts.total}
          caption={`${view.counts.female} female · ${view.counts.male} male${view.stopped ? ` · ${view.stopped} stopped` : ""}`}
          icon={Users}
        />
        <KpiTile label="Sports" value={view.sports.length} caption="With at least one athlete" icon={Layers} />
        <KpiTile label="Results recorded" value={view.results} caption="Across all tracked athletes" icon={Medal} />
      </section>

      <section aria-label="Sports and gender" className="mt-12">
        <h2 className="eyebrow">Sports and gender</h2>
        <div className="mt-4 rounded-2xl border border-paper-line bg-paper p-5 shadow-card">
          <SportGenderTable rows={view.sports} />
        </div>
      </section>

      <section aria-label="Athletes" className="mt-12">
        <h2 className="eyebrow">Athletes</h2>
        <p className="mt-2 text-xs text-navy-faint">Select an athlete to see the results and evolution.</p>
        <div className="mt-4 rounded-2xl border border-paper-line bg-paper p-5 shadow-card">
          <AthleteRoster roster={view.roster} showId={SHOW_ATHLETE_NAMES} />
        </div>
      </section>

      <section aria-label="How to read this" className="mt-12 max-w-prose border-t border-paper-line pt-6">
        <h2 className="eyebrow">How to read this</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-navy-soft">
          <li>Reported by the Methodologist; not verified against official results.</li>
          <li>
            Relative position: 100 = first place, 0 = last place. A star (&#9733;) or hollow dot marks
            a small field (fewer than {SMALL_FIELD_THRESHOLD} competitors). Compare events of the same
            level.
          </li>
        </ul>
      </section>
    </main>
  );
}

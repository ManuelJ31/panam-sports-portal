import Image from "next/image";
import { PROGRAM_GROUPS, getNocSummaries } from "@/lib/reports";
import GroupCard from "@/components/GroupCard";
import AthleteTrackingCard from "@/components/AthleteTrackingCard";
import { getOverview, hasAthleteData } from "@/lib/athletes";

export default function HomePage() {
  // The athlete section only appears once athletes have been loaded.
  const overview = hasAthleteData() ? getOverview() : null;

  return (
    <main className="mx-auto w-full max-w-canvas flex-1 px-6 pb-24 pt-16 sm:px-10 sm:pt-24">
      <header className="mb-14 max-w-2xl animate-fadeUp sm:mb-20">
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
          Executive Monitoring Platform
        </h1>
        <p className="mt-5 text-balance text-base leading-relaxed text-navy-soft sm:text-lg">
          Weekly Methodologist Reports
        </p>
      </header>

      <section
        aria-label="Methodologist Program groups"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {PROGRAM_GROUPS.map((group, i) => (
          <div
            key={group.id}
            className="animate-fadeUp"
            style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
          >
            <GroupCard
              label={group.label}
              slug={group.slug}
              summaries={getNocSummaries(group.id)}
            />
          </div>
        ))}
        {overview && (
          <div
            className="animate-fadeUp"
            style={{ animationDelay: `${Math.min(PROGRAM_GROUPS.length * 40, 320)}ms` }}
          >
            <AthleteTrackingCard
              athletes={overview.counts.total}
              sports={overview.sports}
              committees={overview.committees}
            />
          </div>
        )}
      </section>
    </main>
  );
}

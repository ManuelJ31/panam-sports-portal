import Image from "next/image";
import { getNocSummaries } from "@/lib/reports";
import CountryCard from "@/components/CountryCard";

export default function HomePage() {
  const summaries = getNocSummaries();

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
        aria-label="National Olympic Committees"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {summaries.map(({ noc, latestReport }, i) => (
          <div
            key={noc.code}
            className="animate-fadeUp"
            style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
          >
            <CountryCard noc={noc} latestReport={latestReport} />
          </div>
        ))}
      </section>
    </main>
  );
}

import { getNocSummaries } from "@/lib/reports";
import CountryCard from "@/components/CountryCard";

export default function HomePage() {
  const summaries = getNocSummaries();

  return (
    <main className="mx-auto min-h-screen max-w-canvas px-6 pb-24 pt-16 sm:px-10 sm:pt-24">
      <header className="mb-14 max-w-2xl animate-fadeUp sm:mb-20">
        <p className="eyebrow">Panam Sports &middot; Athlete Monitoring</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] text-navy sm:text-5xl">
          Monitoring Portal
        </h1>
        <p className="mt-5 text-balance text-base leading-relaxed text-navy-soft sm:text-lg">
          A weekly view of Methodologist reports across every National Olympic
          Committee — built for a clear, unhurried read.
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

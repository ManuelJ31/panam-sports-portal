import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  PROGRAM_GROUPS,
  getNocSummaries,
  getProgramGroupBySlug,
} from "@/lib/reports";
import CountryCard from "@/components/CountryCard";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROGRAM_GROUPS.map((g) => ({ group: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const { group: slug } = await params;
  const group = getProgramGroupBySlug(slug);
  if (!group) return { title: "Group not found" };

  return {
    title: `${group.label} · Panam Sports Executive Monitoring Platform`,
  };
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group: slug } = await params;
  const group = getProgramGroupBySlug(slug);
  if (!group) notFound();

  const summaries = getNocSummaries(group.id);

  return (
    <main className="mx-auto w-full max-w-canvas flex-1 px-6 pb-24 pt-16 sm:px-10 sm:pt-24">
      <Link
        href="/"
        className="eyebrow inline-flex items-center gap-1.5 text-navy-faint transition-colors hover:text-blue-dim"
      >
        <span aria-hidden>&larr;</span> All Groups
      </Link>

      <header className="mb-14 mt-8 max-w-2xl animate-fadeUp sm:mb-20">
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
          {group.label}
        </h1>
        <p className="mt-5 text-balance text-base leading-relaxed text-navy-soft sm:text-lg">
          Weekly Methodologist Reports
        </p>
      </header>

      {summaries.length === 0 ? (
        <p className="text-navy-soft">No committees have been assigned to this group yet.</p>
      ) : (
        <section
          aria-label={`${group.label} National Olympic Committees`}
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
      )}
    </main>
  );
}

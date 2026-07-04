import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full flex-1 max-w-canvas flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Panam Sports Monitoring Portal</p>
      <h1 className="mt-3 font-display text-3xl text-navy">
        This report couldn&rsquo;t be found
      </h1>
      <p className="mt-3 max-w-sm text-navy-soft">
        It may not have been submitted yet, or the link may be out of date.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-blue-dim"
      >
        Back to all committees
      </Link>
    </main>
  );
}

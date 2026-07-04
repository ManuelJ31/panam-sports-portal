import type { MethodologistReport, Noc } from "@/lib/types";
import { formatDate, formatWeekLabel } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

function MetaField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-4 sm:py-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="font-meta text-sm text-navy">{value}</dd>
    </div>
  );
}

export default function DossierHeader({
  noc,
  report,
}: {
  noc: Noc;
  report: MethodologistReport;
}) {
  return (
    <header className="animate-fadeUp">
      <div className="flex items-center gap-4">
        <span className="text-5xl leading-none" aria-hidden>
          {noc.flag}
        </span>
        <div>
          <p className="eyebrow">{noc.region}</p>
          <h1 className="mt-1 font-display text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            {noc.name}
          </h1>
        </div>
      </div>

      <dl className="mt-10 grid grid-cols-2 divide-y divide-paper-line border-y border-paper-line sm:grid-cols-5 sm:divide-x sm:divide-y-0">
        <div className="pr-4 sm:pr-6">
          <MetaField label="Country" value={noc.name} />
        </div>
        <div className="pl-4 sm:px-6">
          <MetaField label="Week" value={formatWeekLabel(report.weekNumber, report.year)} />
        </div>
        <div className="pr-4 sm:px-6">
          <MetaField label="Methodologist" value={report.methodologist} />
        </div>
        <div className="pl-4 sm:px-6">
          <MetaField label="Submitted" value={formatDate(report.submissionDate)} />
        </div>
        <div className="col-span-2 pt-4 sm:col-span-1 sm:pl-6 sm:pt-0">
          <div className="flex flex-col gap-1.5">
            <dt className="eyebrow">Status</dt>
            <dd>
              <StatusBadge status={report.status} />
            </dd>
          </div>
        </div>
      </dl>
    </header>
  );
}

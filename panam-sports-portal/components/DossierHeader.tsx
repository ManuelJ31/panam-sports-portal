import type { MethodologistReport, Noc } from "@/lib/types";
import { formatDate, formatDateRange, formatWeekLabel } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

function MetaField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-4 sm:py-0">
      <dt className="font-meta text-[11px] font-medium uppercase tracking-widest2 text-white/60">
        {label}
      </dt>
      <dd className="font-meta text-sm text-white">{value}</dd>
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
        <span
          className={`fi fi-${noc.flagCode} rounded text-5xl leading-none shadow-sm`}
          aria-hidden
        />
        <div>
          <p className="eyebrow">{noc.nocGroup}</p>
          <h1 className="mt-1 font-display text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            {noc.name}
          </h1>
        </div>
      </div>

      <dl className="mt-10 grid grid-cols-2 divide-y divide-white/10 rounded-xl bg-navy px-5 sm:grid-cols-5 sm:divide-x sm:divide-y-0 sm:px-6 sm:py-1">
        <div className="pr-4 sm:pr-6">
          <MetaField label="Country" value={noc.name} />
        </div>
        <div className="pl-4 sm:px-6">
          <MetaField label="Week" value={formatWeekLabel(report.weekNumber, report.year)} />
        </div>
        <div className="pr-4 sm:px-6">
          <MetaField
            label="Methodologist"
            value={
              <>
                {report.methodologist}
                {(report.methodologistPrimarySpecialization ||
                  report.methodologistSecondarySpecialization) && (
                  <span className="mt-0.5 block font-meta text-xs font-normal text-white/50">
                    {[
                      report.methodologistPrimarySpecialization,
                      report.methodologistSecondarySpecialization,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </>
            }
          />
        </div>
        <div className="pl-4 sm:px-6">
          <MetaField label="Submitted" value={formatDate(report.submissionDate)} />
        </div>
        <div className="col-span-2 py-4 sm:col-span-1 sm:py-0 sm:pl-6">
          <div className="flex flex-col gap-1.5">
            <dt className="font-meta text-[11px] font-medium uppercase tracking-widest2 text-white/60">
              Status
            </dt>
            <dd>
              <StatusBadge status={report.status} />
            </dd>
          </div>
        </div>
      </dl>

      {report.phaseName && (
        <p className="mt-4 font-meta text-xs text-navy-faint">
          {report.phaseName}
          {report.phaseStartDate && report.phaseEndDate && (
            <> &middot; {formatDateRange(report.phaseStartDate, report.phaseEndDate)}</>
          )}
        </p>
      )}
    </header>
  );
}

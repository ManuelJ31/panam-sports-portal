import type { GenderCount } from "@/lib/athletes";

/** Active athletes by sport and gender (Olympic Solidarity points 7 and 8). */
export default function SportGenderTable({
  rows,
  columns,
}: {
  rows: {
    sport: string;
    counts: GenderCount;
    /** Optional per-committee counts, keyed by NOC code. */
    perNoc?: Record<string, number>;
  }[];
  /** Committee columns to show between Sport and the gender totals. */
  columns?: { code: string; name: string }[];
}) {
  if (rows.length === 0) return null;

  const totals = rows.reduce(
    (t, r) => ({
      female: t.female + r.counts.female,
      male: t.male + r.counts.male,
      total: t.total + r.counts.total,
      para: t.para + r.counts.para,
    }),
    { female: 0, male: 0, total: 0, para: 0 }
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="eyebrow border-b border-paper-line">
            <th className="py-2 pr-3 font-medium">Sport</th>
            {columns?.map((c) => (
              <th key={c.code} className="px-2 py-2 text-right font-medium" title={c.name}>
                {c.code}
              </th>
            ))}
            <th className="px-2 py-2 text-right font-medium">Female</th>
            <th className="px-2 py-2 text-right font-medium">Male</th>
            <th className="px-2 py-2 text-right font-medium">Para</th>
            <th className="py-2 pl-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sport} className="border-b border-paper-line/60">
              <td className="py-2 pr-3 text-navy">{r.sport}</td>
              {columns?.map((c) => (
                <td key={c.code} className="px-2 py-2 text-right text-navy-soft">
                  {r.perNoc?.[c.code] || <span className="text-navy-faint">&middot;</span>}
                </td>
              ))}
              <td className="px-2 py-2 text-right text-navy-soft">{r.counts.female}</td>
              <td className="px-2 py-2 text-right text-navy-soft">{r.counts.male}</td>
              <td className="px-2 py-2 text-right text-navy-soft">{r.counts.para || <span className="text-navy-faint">&middot;</span>}</td>
              <td className="py-2 pl-2 text-right font-medium text-navy">{r.counts.total}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-paper-line font-medium text-navy">
            <td className="py-2 pr-3">Total</td>
            {columns?.map((c) => (
              <td key={c.code} className="px-2 py-2 text-right">
                {rows.reduce((s, r) => s + (r.perNoc?.[c.code] ?? 0), 0)}
              </td>
            ))}
            <td className="px-2 py-2 text-right">{totals.female}</td>
            <td className="px-2 py-2 text-right">{totals.male}</td>
            <td className="px-2 py-2 text-right">{totals.para}</td>
            <td className="py-2 pl-2 text-right">{totals.total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

import type { ReportInitiative } from "@/lib/types";
import Tag, { type Tone } from "@/components/Tag";

const STATUS_TONE: Record<string, Tone> = {
  "In Progress": "blue",
  Completed: "green",
  "On Hold": "gold",
  Delayed: "red",
  Cancelled: "gray",
};

export default function InitiativesTable({ initiatives }: { initiatives: ReportInitiative[] }) {
  if (initiatives.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="eyebrow border-b border-paper-line">
            <th className="py-2 pr-3 font-medium">Initiative</th>
            <th className="py-2 pr-3 font-medium">Category</th>
            <th className="py-2 pr-3 font-medium">Weekly Progress</th>
            <th className="py-2 pl-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {initiatives.map((ini, i) => (
            <tr key={i} className="border-b border-paper-line/60 last:border-0">
              <td className="py-2.5 pr-3 text-navy">{ini.name}</td>
              <td className="py-2.5 pr-3 text-navy-soft">{ini.category}</td>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-paper-line">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${ini.weeklyProgress * 10}%` }}
                    />
                  </div>
                  <span className="font-meta text-xs text-navy-soft">
                    {ini.weeklyProgress * 10}%
                  </span>
                </div>
              </td>
              <td className="py-2.5 pl-3">
                <Tag label={ini.status} tone={STATUS_TONE[ini.status] ?? "gray"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

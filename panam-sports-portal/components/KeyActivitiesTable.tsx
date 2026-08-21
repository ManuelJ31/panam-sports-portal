import type { ReportActivity } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import Tag, { type Tone } from "@/components/Tag";

const STATUS_TONE: Record<string, Tone> = {
  Completed: "green",
  "In Progress": "blue",
  Pending: "gold",
  Cancelled: "gray",
};

export default function KeyActivitiesTable({ activities }: { activities: ReportActivity[] }) {
  if (activities.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="eyebrow border-b border-paper-line">
            <th className="py-2 pr-3 font-medium">Date</th>
            <th className="py-2 pr-3 font-medium">Activity</th>
            <th className="py-2 pl-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a, i) => (
            <tr key={i} className="border-b border-paper-line/60 align-top last:border-0">
              <td className="whitespace-nowrap py-2.5 pr-3 font-meta text-xs text-navy-faint">
                {a.date && formatShortDate(a.date)}
              </td>
              <td className="max-w-prose py-2.5 pr-3 text-navy-soft">{a.description}</td>
              <td className="py-2.5 pl-3">
                <Tag label={a.status} tone={STATUS_TONE[a.status] ?? "gray"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

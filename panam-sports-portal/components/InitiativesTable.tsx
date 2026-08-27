import { Fragment } from "react";
import type { ReportInitiative } from "@/lib/types";
import Tag, { type Tone } from "@/components/Tag";

const STATUS_TONE: Record<string, Tone> = {
  "In Progress": "blue",
  Completed: "green",
  "On Hold": "gold",
  Delayed: "red",
  Cancelled: "gray",
};

export default function InitiativesTable({
  initiatives,
  histories,
  expandedId,
  onToggle,
}: {
  initiatives: ReportInitiative[];
  histories: Record<string, { week: string; progress: number }[]>;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
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
          {initiatives.map((ini) => {
            const isOpen = expandedId === ini.id;
            const history = histories[ini.id] ?? [];

            return (
              <Fragment key={ini.id}>
                <tr
                  onClick={() => onToggle(ini.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggle(ini.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer border-b border-paper-line/60 transition-colors last:border-0 hover:bg-paper-off"
                  aria-expanded={isOpen}
                >
                  <td className="py-2.5 pr-3 text-navy">
                    <span
                      aria-hidden
                      className={`mr-1.5 inline-block text-navy-faint transition-transform print:hidden ${isOpen ? "rotate-90" : ""}`}
                    >
                      &rsaquo;
                    </span>
                    {ini.name}
                  </td>
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
                {isOpen && (
                  <tr className="border-b border-paper-line/60 last:border-0">
                    <td colSpan={4} className="bg-paper-off px-3 py-4">
                      {ini.briefUpdate && (
                        <p className="max-w-prose text-sm leading-relaxed text-navy-soft">
                          {ini.briefUpdate}
                        </p>
                      )}
                      {history.length > 1 && (
                        <div className="mt-3">
                          <p className="eyebrow">Progress history</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {history.map((h) => (
                              <span
                                key={h.week}
                                className="rounded-full border border-paper-line bg-paper px-2.5 py-1 font-meta text-xs text-navy-soft"
                              >
                                {h.week}: {h.progress}/10
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

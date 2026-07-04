import type { ReportStatus } from "@/lib/types";

const STYLES: Record<ReportStatus, { dot: string; text: string; bg: string }> = {
  Draft: {
    dot: "bg-status-draft",
    text: "text-status-draft",
    bg: "bg-status-draftBg",
  },
  Submitted: {
    dot: "bg-status-submitted",
    text: "text-status-submitted",
    bg: "bg-status-submittedBg",
  },
  Reviewed: {
    dot: "bg-status-reviewed",
    text: "text-status-reviewed",
    bg: "bg-status-reviewedBg",
  },
  Approved: {
    dot: "bg-status-approved",
    text: "text-status-approved",
    bg: "bg-status-approvedBg",
  },
  Returned: {
    dot: "bg-status-returned",
    text: "text-status-returned",
    bg: "bg-status-returnedBg",
  },
};

export default function StatusBadge({ status }: { status: ReportStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-meta text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {status}
    </span>
  );
}

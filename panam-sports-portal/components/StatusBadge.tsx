import type { ReportStatus } from "@/lib/types";
import Tag, { type Tone } from "@/components/Tag";

const TONES: Record<ReportStatus, Tone> = {
  Draft: "gray",
  Submitted: "blue",
  Reviewed: "gold",
  Approved: "green",
  Returned: "red",
};

export default function StatusBadge({ status }: { status: ReportStatus }) {
  return <Tag label={status} tone={TONES[status]} />;
}

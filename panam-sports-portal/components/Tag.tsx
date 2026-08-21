export type Tone = "gray" | "blue" | "gold" | "green" | "red";

const TONES: Record<Tone, { dot: string; text: string; bg: string }> = {
  gray: { dot: "bg-status-draft", text: "text-status-draft", bg: "bg-status-draftBg" },
  blue: { dot: "bg-status-submitted", text: "text-status-submitted", bg: "bg-status-submittedBg" },
  gold: { dot: "bg-status-reviewed", text: "text-status-reviewed", bg: "bg-status-reviewedBg" },
  green: { dot: "bg-status-approved", text: "text-status-approved", bg: "bg-status-approvedBg" },
  red: { dot: "bg-status-returned", text: "text-status-returned", bg: "bg-status-returnedBg" },
};

export default function Tag({ label, tone }: { label: string; tone: Tone }) {
  const style = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-meta text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {label}
    </span>
  );
}

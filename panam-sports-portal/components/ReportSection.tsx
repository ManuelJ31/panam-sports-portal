export default function ReportSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-paper-line py-8 first:border-t-0 first:pt-0">
      <h2 className="eyebrow">{label}</h2>
      <p className="mt-3 max-w-prose text-[17px] leading-[1.7] text-navy-soft">
        {children}
      </p>
    </section>
  );
}

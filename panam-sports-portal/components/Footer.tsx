import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-paper-line">
      <div className="mx-auto flex max-w-canvas flex-col items-center gap-2 px-6 py-10 text-center sm:px-10">
        <p className="font-display text-sm font-medium text-navy-soft">
          Panam Sports Executive Monitoring Platform
        </p>

        <div className="flex items-center gap-2 text-xs text-navy-faint">
          <span>Powered by</span>
          <Image
            src="/brand/sportinxl-logo.png"
            alt="SportinXL"
            width={123}
            height={28}
            className="h-6 w-auto"
          />
          <span>Insight Platform</span>
        </div>

        <p className="eyebrow text-navy-faint/70">
          Version 1.0.0 &middot; &copy; 2026 SportinXL
        </p>
      </div>
    </footer>
  );
}

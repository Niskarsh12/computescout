import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 bg-foreground" />
          <span className="text-xs text-muted">
            ComputeScout — Infrastructure intelligence for GPU workloads
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
          <span>Bright Data · Live market data</span>
          <span>Groq · Parse & narrate</span>
          <Link href="/radar" className="hover:text-foreground transition-colors">
            Radar
          </Link>
        </div>
      </div>
    </footer>
  );
}

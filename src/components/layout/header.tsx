import Link from "next/link";
import type { ReactNode } from "react";
import { NavLinks } from "./nav-links";
import { cn } from "@/lib/utils";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-2 w-2 bg-foreground transition-opacity group-hover:opacity-70" />
          <span className="text-sm font-medium tracking-tight text-foreground">
            ComputeScout
          </span>
        </Link>

        <NavLinks />
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  description,
  className,
  eyebrow,
}: {
  title: string;
  description?: string;
  className?: string;
  eyebrow?: string;
}) {
  return (
    <div className={cn("mb-12 animate-fade-up", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
    </div>
  );
}

export function Metric({
  label,
  value,
  subtext,
}: {
  label: string;
  value: ReactNode;
  subtext?: string;
}) {
  return (
    <div>
      <dt className="stat-label">{label}</dt>
      <dd className="mt-2 text-2xl font-medium tabular-nums text-foreground">
        {value}
      </dd>
      {subtext && (
        <dd className="mt-1 text-xs text-muted">{subtext}</dd>
      )}
    </div>
  );
}

export function StatusDot({
  status,
  score,
}: {
  status: "operational" | "degraded" | "outage" | "unknown";
  score?: number;
}) {
  const color =
    status === "operational"
      ? "bg-success"
      : status === "degraded"
        ? "bg-warning"
        : status === "outage"
          ? "bg-destructive"
          : "bg-muted";

  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
      {score !== undefined && (
        <span className="tabular-nums text-foreground">{score}</span>
      )}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="eyebrow mb-4">{children}</h2>
  );
}

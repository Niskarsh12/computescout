import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PipelineBar() {
  const steps = ["Parse", "Fetch", "Score", "Explain"];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <span className="eyebrow text-foreground/70">{step}</span>
          {i < steps.length - 1 && (
            <span className="text-muted text-xs">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  subtext,
  highlight,
}: {
  label: string;
  value: ReactNode;
  subtext?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "card p-5",
        highlight && "border-foreground/20"
      )}
    >
      <p className="stat-label">{label}</p>
      <p className={cn("mt-2", typeof value === "object" ? "text-base" : "stat-value")}>
        {value}
      </p>
      {subtext && (
        <p className="mt-1 text-xs text-muted">{subtext}</p>
      )}
    </div>
  );
}

export function ScoreDisplay({ score }: { score: number }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="eyebrow">Score</span>
      <div className="score-ring">{score}</div>
    </div>
  );
}

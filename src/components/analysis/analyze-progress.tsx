"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Parsing workload",
  "Fetching market data",
  "Scoring providers",
  "Generating explanation",
];

export function AnalyzeProgress({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }

    setStep(0);
    const interval = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 1200);

    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="border border-border bg-surface p-4 space-y-3">
      {STEPS.map((label, i) => (
        <div
          key={label}
          className={cn(
            "pipeline-step",
            i < step && "done",
            i === step && "active"
          )}
        >
          <span className="dot" />
          <span>{label}</span>
          {i === step && (
            <span className="ml-auto animate-pulse-subtle">···</span>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ComputeRecommendation } from "@/domain/recommendation";
import { GPU_LABELS, REGION_LABELS } from "@/domain/provider";
import { PRIORITY_LABELS, WORKLOAD_TYPE_LABELS } from "@/domain/workload";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { Metric, SectionLabel } from "@/components/layout/header";
import { PipelineBar, ScoreDisplay } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";

export function ResultsView() {
  const [result, setResult] = useState<ComputeRecommendation | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("computescout-result");
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.analyzedAt = new Date(parsed.analyzedAt);
      setResult(parsed);
    }
  }, []);

  if (!result) {
    return (
      <div className="py-24 text-center">
        <p className="mb-2 text-lg font-medium">No analysis results</p>
        <p className="mb-8 text-sm text-muted">
          Run a workload analysis to see recommendations.
        </p>
        <Button asChild>
          <Link href="/analyze">Run Analysis</Link>
        </Button>
      </div>
    );
  }

  const { profile, primary, alternatives, explanation, analyzedAt } = result;
  const gpuLabel =
    GPU_LABELS[primary.gpuType as keyof typeof GPU_LABELS] ?? primary.gpuType;
  const regionLabel =
    REGION_LABELS[primary.region as keyof typeof REGION_LABELS] ??
    primary.region;

  return (
    <div className="animate-fade-up space-y-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PipelineBar />
        <span className="text-xs text-muted">
          Analyzed {timeAgo(analyzedAt)}
        </span>
      </div>

      <div>
        <SectionLabel>Recommendation</SectionLabel>
        <div className="card-elevated p-6 md:p-8">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <Link
                href={`/providers/${primary.provider.slug}`}
                className="text-2xl font-medium tracking-tight hover:underline md:text-3xl"
              >
                {primary.provider.name}
              </Link>
              <p className="mt-2 text-sm text-muted">
                {gpuLabel} · {regionLabel}
              </p>
            </div>
            <ScoreDisplay score={primary.score.total} />
          </div>

          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <Metric label="Estimated Cost" value={formatCurrency(primary.estimatedCost)} />
            <Metric
              label="Completion"
              value={`~${primary.estimatedCompletionHours}h`}
              subtext={`${profile.deadlineHours}h deadline`}
            />
            <Metric label="Reliability" value={primary.score.reliability} />
            <Metric
              label="Availability"
              value={`${primary.availableGpus}`}
              subtext={`${gpuLabel}s · est.`}
            />
            {primary.savingsVsAws != null && primary.savingsVsAws > 0 && (
              <Metric
                label="Savings vs AWS"
                value={formatCurrency(primary.savingsVsAws)}
              />
            )}
          </dl>

          <div className="mt-8 border-t border-border pt-8">
            <p className="eyebrow mb-3">Analysis</p>
            <p className="max-w-3xl text-sm leading-relaxed text-foreground/90">
              {explanation}
            </p>
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Workload</SectionLabel>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Type", value: WORKLOAD_TYPE_LABELS[profile.workloadType] },
            { label: "Model", value: profile.model?.replace(/_/g, " ") ?? "—" },
            { label: "Budget", value: formatCurrency(profile.budget) },
            { label: "Deadline", value: `${profile.deadlineHours}h` },
            { label: "Region", value: REGION_LABELS[profile.region] },
            { label: "Priority", value: PRIORITY_LABELS[profile.priority] },
          ].map((item) => (
            <div key={item.label} className="card p-4">
              <p className="stat-label">{item.label}</p>
              <p className="mt-2 text-sm font-medium capitalize tabular-nums">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {alternatives.length > 0 && (
        <div>
          <SectionLabel>Alternatives</SectionLabel>
          <div className="overflow-x-auto border border-border">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Score</th>
                  <th>Cost</th>
                  <th>Available</th>
                  <th>Region</th>
                </tr>
              </thead>
              <tbody>
                {alternatives.map((alt) => (
                  <tr key={alt.provider.id}>
                    <td>
                      <Link
                        href={`/providers/${alt.provider.slug}`}
                        className="font-medium hover:underline"
                      >
                        {alt.provider.name}
                      </Link>
                    </td>
                    <td className="tabular-nums">{alt.score.total}</td>
                    <td className="tabular-nums">{formatCurrency(alt.estimatedCost)}</td>
                    <td className="tabular-nums">
                      {alt.availableGpus}{" "}
                      {GPU_LABELS[alt.gpuType as keyof typeof GPU_LABELS] ?? alt.gpuType}
                    </td>
                    <td>
                      {REGION_LABELS[alt.region as keyof typeof REGION_LABELS] ?? alt.region}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-border pt-8">
        <Button asChild variant="outline">
          <Link href="/analyze">New Analysis</Link>
        </Button>
        <Button asChild>
          <Link href="/radar">View Global Radar</Link>
        </Button>
      </div>
    </div>
  );
}

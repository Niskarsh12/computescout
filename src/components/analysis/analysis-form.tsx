"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { analyzeWorkloadAction } from "@/actions/analyze";
import { AnalyzeProgress } from "@/components/analysis/analyze-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PRIORITY_LABELS } from "@/domain/workload";
import { REGION_LABELS } from "@/domain/provider";
import type { Priority, Region } from "@/domain/provider";

export function AnalysisForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"natural" | "manual">(
    compact ? "natural" : "manual"
  );
  const [rawInput, setRawInput] = useState(
    "Fine-tune Llama 70B in Europe under $1000 and finish within 48 hours"
  );
  const [workload, setWorkload] = useState("Fine-tune Llama 70B");
  const [budget, setBudget] = useState("1000");
  const [deadline, setDeadline] = useState("48");
  const [region, setRegion] = useState<Region>("europe");
  const [priority, setPriority] = useState<Priority>("balanced");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await analyzeWorkloadAction(
          mode === "natural"
            ? { rawInput, workload: "", budget: 0, deadlineHours: 0, region: "global", priority: "balanced" }
            : {
                workload,
                budget: parseFloat(budget),
                deadlineHours: parseFloat(deadline),
                region,
                priority,
              }
        );

        sessionStorage.setItem("computescout-result", JSON.stringify(result));
        router.push("/results");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isPending && <AnalyzeProgress active />}

      {!isPending && (
        <>
          {mode === "natural" ? (
            <div className="space-y-3">
              <Label htmlFor="raw-input">Describe your workload</Label>
              <Textarea
                id="raw-input"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={compact ? 3 : 4}
                placeholder="Fine-tune Llama 70B in Europe under $1000 and finish within 48 hours"
                className="text-base leading-relaxed"
              />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <Label htmlFor="workload">Workload</Label>
                <Input
                  id="workload"
                  value={workload}
                  onChange={(e) => setWorkload(e.target.value)}
                  placeholder="Fine-tune Llama 70B"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="budget">Budget (USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    min={1}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="deadline">Deadline (hours)</Label>
                  <Input
                    id="deadline"
                    type="number"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Region</Label>
                  <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REGION_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as Priority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <Button type="submit" size="lg" disabled={isPending} className="min-w-[140px]">
          {isPending ? "Analyzing…" : "Analyze"}
        </Button>

        {!isPending && (
          <>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <button
              type="button"
              onClick={() => setMode(mode === "natural" ? "manual" : "natural")}
              className="text-xs text-muted transition-colors hover:text-foreground"
            >
              {mode === "natural"
                ? "Configure manually →"
                : "← Use natural language"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}

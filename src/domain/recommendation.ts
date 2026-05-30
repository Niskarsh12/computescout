import { z } from "zod";
import { ProviderSchema } from "./provider";
import { WorkloadProfileSchema } from "./workload";

export const RecommendationScoreSchema = z.object({
  total: z.number().min(0).max(100),
  price: z.number().min(0).max(100),
  availability: z.number().min(0).max(100),
  reliability: z.number().min(0).max(100),
  region: z.number().min(0).max(100),
});

export type RecommendationScore = z.infer<typeof RecommendationScoreSchema>;

export const RankedProviderSchema = z.object({
  provider: ProviderSchema,
  score: RecommendationScoreSchema,
  estimatedCost: z.number(),
  estimatedCompletionHours: z.number(),
  availableGpus: z.number().int(),
  gpuType: z.string(),
  hourlyPrice: z.number(),
  savingsVsAws: z.number().optional(),
  region: z.string(),
});

export type RankedProvider = z.infer<typeof RankedProviderSchema>;

export const ComputeRecommendationSchema = z.object({
  id: z.string(),
  profile: WorkloadProfileSchema,
  primary: RankedProviderSchema,
  alternatives: z.array(RankedProviderSchema),
  explanation: z.string(),
  analyzedAt: z.coerce.date(),
});

export type ComputeRecommendation = z.infer<typeof ComputeRecommendationSchema>;

// AWS baseline pricing for savings calculation (H100 ~ $4.50/hr equivalent)
export const AWS_BASELINE_HOURLY: Record<string, number> = {
  h100: 4.5,
  a100: 3.2,
  "a100-80gb": 3.5,
  l40s: 1.8,
  rtx4090: 1.2,
  rtx3090: 0.8,
  v100: 2.0,
  mi300x: 4.0,
};

export function calculateAwsEquivalent(
  gpuType: string,
  gpuHours: number,
  gpuCount: number
): number {
  const hourly = AWS_BASELINE_HOURLY[gpuType] ?? 3.0;
  return hourly * gpuHours * gpuCount;
}

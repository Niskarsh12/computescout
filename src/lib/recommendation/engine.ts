import type { MarketEntry, MarketSnapshot } from "@/domain/market";
import type { WorkloadProfile } from "@/domain/workload";
import { inferGpuRequirements } from "@/domain/workload";
import type {
  ComputeRecommendation,
  RankedProvider,
  RecommendationScore,
} from "@/domain/recommendation";
import { calculateAwsEquivalent } from "@/domain/recommendation";
import { generateId } from "@/lib/utils";
import {
  estimateCompletionHours,
  estimateCost,
  gpuMatches,
  isEligible,
  scoreAvailability,
  scorePrice,
  scoreRegion,
  scoreReliability,
} from "./scorers";
import { getWeights, type ScoreWeights } from "./weights";

interface ScoredEntry {
  entry: MarketEntry;
  score: RecommendationScore;
  estimatedCost: number;
  estimatedCompletionHours: number;
  gpuCount: number;
}

function computeTotalScore(
  scores: Omit<RecommendationScore, "total">,
  weights: ScoreWeights
): number {
  const totalWeight =
    weights.price + weights.availability + weights.reliability + weights.region;

  const weighted =
    scores.price * weights.price +
    scores.availability * weights.availability +
    scores.reliability * weights.reliability +
    scores.region * weights.region;

  return Math.round(weighted / totalWeight);
}

function scoreEntry(
  entry: MarketEntry,
  profile: WorkloadProfile,
  gpuHours: number,
  minGpus: number,
  requiredGpu: string,
  weights: ScoreWeights
): ScoredEntry | null {
  if (!gpuMatches(requiredGpu as Parameters<typeof gpuMatches>[0], entry.gpuType)) {
    return null;
  }

  const gpuCount = Math.min(entry.availability, Math.max(minGpus, 1));
  const cost = estimateCost(entry.hourlyPrice, gpuHours, gpuCount);
  const completion = estimateCompletionHours(gpuHours, gpuCount);

  if (
    !isEligible(
      cost,
      profile.budget,
      completion,
      profile.deadlineHours,
      entry.status,
      entry.availability
    )
  ) {
    return null;
  }

  const priceScore = scorePrice(cost, profile.budget);
  const availabilityScore = scoreAvailability(entry.availability, minGpus);
  const reliabilityScore = scoreReliability(entry.healthScore, entry.status);
  const regionScore = scoreRegion(profile.region, entry.region);

  const partial = { price: priceScore, availability: availabilityScore, reliability: reliabilityScore, region: regionScore };
  const total = computeTotalScore(partial, weights);

  return {
    entry,
    score: { ...partial, total },
    estimatedCost: Math.round(cost),
    estimatedCompletionHours: completion,
    gpuCount,
  };
}

function toRankedProvider(scored: ScoredEntry): RankedProvider {
  const { entry, score, estimatedCost, estimatedCompletionHours, gpuCount } =
    scored;
  const awsCost = calculateAwsEquivalent(
    entry.gpuType,
    estimatedCompletionHours,
    gpuCount
  );

  return {
    provider: entry.provider,
    score,
    estimatedCost,
    estimatedCompletionHours,
    availableGpus: entry.availability,
    gpuType: entry.gpuType,
    hourlyPrice: entry.hourlyPrice,
    savingsVsAws: Math.max(0, Math.round(awsCost - estimatedCost)),
    region: entry.region,
  };
}

export function generateRecommendation(
  profile: WorkloadProfile,
  market: MarketSnapshot,
  explanation: string
): ComputeRecommendation {
  const weights = getWeights(profile.priority);
  const { gpu: requiredGpu, gpuHours, minGpus } = inferGpuRequirements(profile);

  const scored: ScoredEntry[] = [];

  for (const entry of market.entries) {
    const result = scoreEntry(
      entry,
      profile,
      gpuHours,
      minGpus,
      requiredGpu,
      weights
    );
    if (result) scored.push(result);
  }

  // Deduplicate: keep best score per provider
  const byProvider = new Map<string, ScoredEntry>();
  for (const s of scored) {
    const existing = byProvider.get(s.entry.provider.id);
    if (!existing || s.score.total > existing.score.total) {
      byProvider.set(s.entry.provider.id, s);
    }
  }

  const ranked = Array.from(byProvider.values()).sort(
    (a, b) => b.score.total - a.score.total
  );

  if (ranked.length === 0) {
    // Fallback: return best available even if over budget
    const fallback = market.entries
      .filter((e) => gpuMatches(requiredGpu as Parameters<typeof gpuMatches>[0], e.gpuType))
      .sort((a, b) => a.hourlyPrice - b.hourlyPrice)[0];

    if (!fallback) {
      throw new Error("No suitable providers found for this workload");
    }

    const gpuCount = Math.max(minGpus, 1);
    const cost = estimateCost(fallback.hourlyPrice, gpuHours, gpuCount);
    const completion = estimateCompletionHours(gpuHours, gpuCount);

    const partial = {
      price: scorePrice(cost, profile.budget),
      availability: scoreAvailability(fallback.availability, minGpus),
      reliability: scoreReliability(fallback.healthScore, fallback.status),
      region: scoreRegion(profile.region, fallback.region),
    };

    const primary = toRankedProvider({
      entry: fallback,
      score: { ...partial, total: computeTotalScore(partial, weights) },
      estimatedCost: Math.round(cost),
      estimatedCompletionHours: completion,
      gpuCount,
    });

    return {
      id: generateId(),
      profile,
      primary,
      alternatives: [],
      explanation,
      analyzedAt: new Date(),
    };
  }

  const [best, ...rest] = ranked;

  return {
    id: generateId(),
    profile,
    primary: toRankedProvider(best),
    alternatives: rest.slice(0, 4).map(toRankedProvider),
    explanation,
    analyzedAt: new Date(),
  };
}

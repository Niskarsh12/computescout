"use server";

import { fetchMarketSnapshot } from "@/lib/bright-data/aggregator";
import { generateRecommendation } from "@/lib/recommendation/engine";
import { narrateRecommendation } from "@/lib/groq/narrator";
import {
  parseStructuredInput,
  parseWorkloadInput,
} from "@/lib/groq/parser";
import type { WorkloadRequest } from "@/domain/workload";
import type { ComputeRecommendation } from "@/domain/recommendation";

export async function analyzeWorkloadAction(
  request: WorkloadRequest
): Promise<ComputeRecommendation> {
  const profile = request.rawInput
    ? await parseWorkloadInput(request.rawInput)
    : parseStructuredInput({
        workload: request.workload,
        budget: request.budget,
        deadlineHours: request.deadlineHours,
        region: request.region,
        priority: request.priority,
      });

  const market = await fetchMarketSnapshot();
  const partial = generateRecommendation(profile, market, "");
  const explanation = await narrateRecommendation(partial);

  return { ...partial, explanation };
}

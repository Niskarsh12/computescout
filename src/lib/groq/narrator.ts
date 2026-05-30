import Groq from "groq-sdk";
import type { ComputeRecommendation } from "@/domain/recommendation";
import {
  GPU_LABELS,
  REGION_LABELS,
} from "@/domain/provider";
import { PRIORITY_LABELS, WORKLOAD_TYPE_LABELS } from "@/domain/workload";

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const NARRATE_SYSTEM_PROMPT = `You are a narrator for ComputeScout, an infrastructure intelligence platform.
Given a structured compute recommendation, write a concise 2-3 sentence explanation.
Be precise and technical. Do not mention AI, LLMs, or that you are an assistant.
Write as if you are a senior infrastructure analyst reporting findings.
Focus on: why this provider was chosen, cost/availability/reliability tradeoffs, and deadline feasibility.`;

export async function narrateRecommendation(
  recommendation: Omit<ComputeRecommendation, "explanation">
): Promise<string> {
  const client = getGroqClient();
  const fallback = generateFallbackExplanation(recommendation);

  if (!client) return fallback;

  try {
    const context = buildContext(recommendation);
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: NARRATE_SYSTEM_PROMPT },
        { role: "user", content: context },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    return content || fallback;
  } catch (error) {
    console.error("Groq narration failed:", error);
    return fallback;
  }
}

function buildContext(
  rec: Omit<ComputeRecommendation, "explanation">
): string {
  const { profile, primary, alternatives } = rec;
  return JSON.stringify({
    workload: WORKLOAD_TYPE_LABELS[profile.workloadType],
    model: profile.model,
    budget: profile.budget,
    deadlineHours: profile.deadlineHours,
    region: REGION_LABELS[profile.region],
    priority: PRIORITY_LABELS[profile.priority],
    recommendation: {
      provider: primary.provider.name,
      score: primary.score.total,
      estimatedCost: primary.estimatedCost,
      completionHours: primary.estimatedCompletionHours,
      availableGpus: primary.availableGpus,
      gpuType: GPU_LABELS[primary.gpuType as keyof typeof GPU_LABELS] ?? primary.gpuType,
      reliability: primary.score.reliability,
      savingsVsAws: primary.savingsVsAws,
    },
    alternatives: alternatives.map((a) => ({
      provider: a.provider.name,
      score: a.score.total,
      cost: a.estimatedCost,
    })),
  });
}

function generateFallbackExplanation(
  rec: Omit<ComputeRecommendation, "explanation">
): string {
  const { profile, primary } = rec;
  const gpu =
    GPU_LABELS[primary.gpuType as keyof typeof GPU_LABELS] ?? primary.gpuType;
  const region = REGION_LABELS[profile.region];

  return (
    `${primary.provider.name} is recommended because it provides the best balance of ` +
    `reliability (${primary.score.reliability}), availability (${primary.availableGpus} ${gpu}s), ` +
    `and cost ($${primary.estimatedCost}) for your ${WORKLOAD_TYPE_LABELS[profile.workloadType].toLowerCase()} workload in ${region}. ` +
    `Estimated completion in ${primary.estimatedCompletionHours} hours remains within your ${profile.deadlineHours}-hour deadline.` +
    (primary.savingsVsAws
      ? ` Potential savings of $${primary.savingsVsAws} compared to AWS equivalent pricing.`
      : "")
  );
}

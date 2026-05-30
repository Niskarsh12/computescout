import type { Priority } from "@/domain/provider";

export interface ScoreWeights {
  price: number;
  availability: number;
  reliability: number;
  region: number;
}

export const WEIGHT_PROFILES: Record<Priority, ScoreWeights> = {
  cost: { price: 0.45, availability: 0.2, reliability: 0.15, region: 0.2 },
  speed: { price: 0.15, availability: 0.45, reliability: 0.2, region: 0.2 },
  reliability: { price: 0.15, availability: 0.2, reliability: 0.45, region: 0.2 },
  balanced: { price: 0.25, availability: 0.25, reliability: 0.25, region: 0.25 },
};

export function getWeights(priority: Priority): ScoreWeights {
  return WEIGHT_PROFILES[priority];
}

export const STATUS_PENALTIES = {
  operational: 0,
  degraded: 15,
  outage: 50,
  unknown: 10,
} as const;

export const BUDGET_TOLERANCE = 1.1;

export const AWS_BASELINE = {
  h100: 4.5,
  a100: 3.2,
  "a100-80gb": 3.5,
  l40s: 1.8,
  rtx4090: 1.2,
  rtx3090: 0.8,
  v100: 2.0,
  mi300x: 4.0,
} as const;

export const GPU_HIERARCHY: Record<string, string[]> = {
  h100: ["h100"],
  a100: ["a100", "a100-80gb", "h100"],
  "a100-80gb": ["a100-80gb", "a100", "h100"],
  l40s: ["l40s", "a100", "rtx4090"],
  rtx4090: ["rtx4090", "rtx3090", "l40s"],
  rtx3090: ["rtx3090", "rtx4090"],
  v100: ["v100", "a100"],
  mi300x: ["mi300x", "h100"],
};

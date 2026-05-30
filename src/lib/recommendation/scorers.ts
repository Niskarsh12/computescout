import type { GpuType, ProviderStatus, Region } from "@/domain/provider";
import { regionsMatch } from "@/domain/market";
import { BUDGET_TOLERANCE, STATUS_PENALTIES } from "./weights";

export function scorePrice(
  estimatedCost: number,
  budget: number
): number {
  if (estimatedCost <= 0) return 0;
  const ratio = estimatedCost / budget;
  if (ratio > BUDGET_TOLERANCE) return 0;
  return Math.max(0, Math.min(100, 100 - ratio * 80));
}

export function scoreAvailability(
  availableGpus: number,
  requiredGpus: number
): number {
  if (availableGpus <= 0) return 0;
  if (requiredGpus <= 0) return 50;
  return Math.min(100, (availableGpus / requiredGpus) * 100);
}

export function scoreReliability(
  healthScore: number,
  status: ProviderStatus
): number {
  const penalty = STATUS_PENALTIES[status] ?? 10;
  return Math.max(0, Math.min(100, healthScore - penalty));
}

export function scoreRegion(
  requestedRegion: Region,
  availableRegion: Region
): number {
  if (requestedRegion === availableRegion) return 100;
  if (requestedRegion === "global" || availableRegion === "global") return 70;
  if (regionsMatch(requestedRegion, availableRegion)) return 70;
  return 30;
}

export function estimateCost(
  hourlyPrice: number,
  gpuHours: number,
  gpuCount: number
): number {
  return hourlyPrice * gpuHours * gpuCount;
}

export function estimateCompletionHours(
  gpuHours: number,
  gpuCount: number
): number {
  return Math.ceil(gpuHours / Math.max(gpuCount, 1));
}

export function isEligible(
  estimatedCost: number,
  budget: number,
  completionHours: number,
  deadlineHours: number,
  status: ProviderStatus,
  availability: number
): boolean {
  if (status === "outage") return false;
  if (availability <= 0) return false;
  if (estimatedCost > budget * BUDGET_TOLERANCE) return false;
  if (completionHours > deadlineHours) return false;
  return true;
}

export function gpuMatches(required: GpuType, available: GpuType): boolean {
  if (required === available) return true;
  const hierarchy: Record<string, string[]> = {
    h100: ["h100"],
    a100: ["a100", "a100-80gb", "h100"],
    "a100-80gb": ["a100-80gb", "a100", "h100"],
    l40s: ["l40s", "a100", "rtx4090"],
    rtx4090: ["rtx4090", "rtx3090", "l40s"],
    rtx3090: ["rtx3090", "rtx4090"],
    v100: ["v100", "a100"],
    mi300x: ["mi300x", "h100"],
  };
  return hierarchy[required]?.includes(available) ?? false;
}

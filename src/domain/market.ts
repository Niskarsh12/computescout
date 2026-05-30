import { z } from "zod";
import {
  GpuTypeSchema,
  ProviderSchema,
  ProviderStatusSchema,
  RegionSchema,
} from "./provider";

export const MarketEntrySchema = z.object({
  provider: ProviderSchema,
  gpuType: GpuTypeSchema,
  region: RegionSchema,
  hourlyPrice: z.number().positive(),
  availability: z.number().int().min(0),
  healthScore: z.number().min(0).max(100),
  status: ProviderStatusSchema,
  lastUpdated: z.coerce.date(),
  dataSource: z.enum(["live", "seed"]),
});

export type MarketEntry = z.infer<typeof MarketEntrySchema>;

export const MarketSnapshotSchema = z.object({
  entries: z.array(MarketEntrySchema),
  fetchedAt: z.coerce.date(),
  sourceBreakdown: z.object({
    live: z.number().int(),
    seed: z.number().int(),
  }),
});

export type MarketSnapshot = z.infer<typeof MarketSnapshotSchema>;

export interface NormalizedPricing {
  providerId: string;
  gpuType: z.infer<typeof GpuTypeSchema>;
  region: z.infer<typeof RegionSchema>;
  hourlyPrice: number;
  live: boolean;
}

export interface NormalizedInventory {
  providerId: string;
  gpuType: z.infer<typeof GpuTypeSchema>;
  region: z.infer<typeof RegionSchema>;
  availableCount: number;
  totalCapacity?: number;
}

export interface NormalizedAvailability {
  providerId: string;
  gpuType: z.infer<typeof GpuTypeSchema>;
  region: z.infer<typeof RegionSchema>;
  available: boolean;
  count: number;
}

export interface NormalizedStatus {
  providerId: string;
  status: z.infer<typeof ProviderStatusSchema>;
  healthScore: number;
  incidents: Array<{
    title: string;
    severity: "minor" | "major" | "critical";
    startedAt: Date;
    resolvedAt?: Date;
  }>;
  summary: string;
}

export const CONTINENT_MAP: Record<string, string[]> = {
  europe: ["europe", "eu-west"],
  us: ["us", "us-east", "us-west"],
  asia: ["asia", "apac"],
};

export function regionsMatch(requested: string, available: string): boolean {
  if (requested === available) return true;
  if (requested === "global" || available === "global") return true;

  for (const [, regions] of Object.entries(CONTINENT_MAP)) {
    if (regions.includes(requested) && regions.includes(available)) {
      return true;
    }
  }
  return false;
}

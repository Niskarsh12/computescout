import { z } from "zod";

export const RegionSchema = z.enum([
  "global",
  "us",
  "us-east",
  "us-west",
  "europe",
  "eu-west",
  "asia",
  "apac",
]);

export const GpuTypeSchema = z.enum([
  "h100",
  "a100",
  "a100-80gb",
  "l40s",
  "rtx4090",
  "rtx3090",
  "v100",
  "mi300x",
]);

export const ProviderStatusSchema = z.enum([
  "operational",
  "degraded",
  "outage",
  "unknown",
]);

export const PrioritySchema = z.enum([
  "cost",
  "speed",
  "reliability",
  "balanced",
]);

export const WorkloadTypeSchema = z.enum([
  "training",
  "fine_tuning",
  "inference",
  "rendering",
  "general",
]);

export type Region = z.infer<typeof RegionSchema>;
export type GpuType = z.infer<typeof GpuTypeSchema>;
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type WorkloadType = z.infer<typeof WorkloadTypeSchema>;

export const ProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  website: z.string().url(),
  regions: z.array(RegionSchema),
  supportedGpus: z.array(GpuTypeSchema),
});

export type Provider = z.infer<typeof ProviderSchema>;

export const IncidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(["minor", "major", "critical"]),
  startedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().optional(),
  description: z.string().optional(),
});

export type Incident = z.infer<typeof IncidentSchema>;

export const ProviderHealthSchema = z.object({
  providerId: z.string(),
  score: z.number().min(0).max(100),
  status: ProviderStatusSchema,
  recentIncidents: z.array(IncidentSchema),
  priceTrend: z.enum(["up", "down", "stable"]),
  availabilityLevel: z.enum(["high", "medium", "low"]),
  summary: z.string(),
  lastUpdated: z.coerce.date(),
});

export type ProviderHealth = z.infer<typeof ProviderHealthSchema>;

export const ProviderInventorySchema = z.object({
  providerId: z.string(),
  gpuType: GpuTypeSchema,
  region: RegionSchema,
  availableCount: z.number().int().min(0),
  totalCapacity: z.number().int().min(0).optional(),
  lastUpdated: z.coerce.date(),
});

export type ProviderInventory = z.infer<typeof ProviderInventorySchema>;

export const PROVIDERS: Provider[] = [
  {
    id: "nebius",
    name: "Nebius",
    slug: "nebius",
    website: "https://nebius.com",
    regions: ["europe", "eu-west"],
    supportedGpus: ["h100", "a100"],
  },
  {
    id: "runpod",
    name: "RunPod",
    slug: "runpod",
    website: "https://runpod.io",
    regions: ["global", "us", "europe"],
    supportedGpus: ["h100", "a100", "rtx4090", "l40s"],
  },
  {
    id: "vast",
    name: "Vast.ai",
    slug: "vast",
    website: "https://vast.ai",
    regions: ["global"],
    supportedGpus: ["rtx4090", "rtx3090", "a100"],
  },
  {
    id: "lambda",
    name: "Lambda",
    slug: "lambda",
    website: "https://lambdalabs.com",
    regions: ["us-west", "us"],
    supportedGpus: ["h100", "a100"],
  },
  {
    id: "tensordock",
    name: "TensorDock",
    slug: "tensordock",
    website: "https://tensordock.com",
    regions: ["us", "europe"],
    supportedGpus: ["a100", "rtx4090"],
  },
  {
    id: "crusoe",
    name: "Crusoe",
    slug: "crusoe",
    website: "https://crusoe.ai",
    regions: ["us"],
    supportedGpus: ["h100", "a100"],
  },
  {
    id: "coreweave",
    name: "CoreWeave",
    slug: "coreweave",
    website: "https://coreweave.com",
    regions: ["us", "europe"],
    supportedGpus: ["h100", "a100"],
  },
  {
    id: "together",
    name: "Together AI",
    slug: "together",
    website: "https://together.ai",
    regions: ["us"],
    supportedGpus: ["h100", "a100"],
  },
];

export function getProviderById(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function getProviderBySlug(slug: string): Provider | undefined {
  return PROVIDERS.find((p) => p.slug === slug);
}

export const REGION_LABELS: Record<Region, string> = {
  global: "Global",
  us: "United States",
  "us-east": "US East",
  "us-west": "US West",
  europe: "Europe",
  "eu-west": "EU West",
  asia: "Asia",
  apac: "APAC",
};

export const GPU_LABELS: Record<GpuType, string> = {
  h100: "H100",
  a100: "A100",
  "a100-80gb": "A100 80GB",
  l40s: "L40S",
  rtx4090: "RTX 4090",
  rtx3090: "RTX 3090",
  v100: "V100",
  mi300x: "MI300X",
};

import { z } from "zod";
import {
  GpuTypeSchema,
  PrioritySchema,
  RegionSchema,
  WorkloadTypeSchema,
} from "./provider";

export const WorkloadRequestSchema = z.object({
  rawInput: z.string().optional(),
  workload: z.string().optional().default(""),
  budget: z.number().optional().default(1000),
  deadlineHours: z.number().optional().default(48),
  region: RegionSchema.optional().default("global"),
  priority: PrioritySchema.optional().default("balanced"),
});

export type WorkloadRequest = z.infer<typeof WorkloadRequestSchema>;

export const WorkloadProfileSchema = z.object({
  workloadType: WorkloadTypeSchema,
  model: z.string().optional(),
  budget: z.number().positive(),
  deadlineHours: z.number().positive(),
  region: RegionSchema,
  priority: PrioritySchema,
  requiredGpu: GpuTypeSchema.optional(),
  estimatedGpuHours: z.number().positive().optional(),
  description: z.string().optional(),
});

export type WorkloadProfile = z.infer<typeof WorkloadProfileSchema>;

export const GPU_REQUIREMENTS: Record<
  string,
  { gpu: z.infer<typeof GpuTypeSchema>; gpuHours: number; minGpus: number }
> = {
  llama_70b: { gpu: "h100", gpuHours: 48, minGpus: 4 },
  llama_8b: { gpu: "a100", gpuHours: 8, minGpus: 1 },
  llama_13b: { gpu: "a100", gpuHours: 16, minGpus: 2 },
  mistral_7b: { gpu: "a100", gpuHours: 6, minGpus: 1 },
  sd_xl: { gpu: "rtx4090", gpuHours: 4, minGpus: 1 },
  default: { gpu: "a100", gpuHours: 24, minGpus: 1 },
};

export function inferGpuRequirements(profile: WorkloadProfile): {
  gpu: z.infer<typeof GpuTypeSchema>;
  gpuHours: number;
  minGpus: number;
} {
  if (profile.requiredGpu && profile.estimatedGpuHours) {
    return {
      gpu: profile.requiredGpu,
      gpuHours: profile.estimatedGpuHours,
      minGpus: 1,
    };
  }

  const modelKey = profile.model?.toLowerCase().replace(/[\s-]/g, "_") ?? "";
  for (const [key, req] of Object.entries(GPU_REQUIREMENTS)) {
    if (modelKey.includes(key.replace("_", "")) || modelKey.includes(key)) {
      return req;
    }
  }

  if (profile.workloadType === "fine_tuning") {
    return GPU_REQUIREMENTS.llama_70b;
  }
  if (profile.workloadType === "inference") {
    return { gpu: "a100", gpuHours: 4, minGpus: 1 };
  }

  return GPU_REQUIREMENTS.default;
}

export const PRIORITY_LABELS: Record<
  z.infer<typeof PrioritySchema>,
  string
> = {
  cost: "Cost",
  speed: "Speed",
  reliability: "Reliability",
  balanced: "Balanced",
};

export const WORKLOAD_TYPE_LABELS: Record<
  z.infer<typeof WorkloadTypeSchema>,
  string
> = {
  training: "Training",
  fine_tuning: "Fine-tuning",
  inference: "Inference",
  rendering: "Rendering",
  general: "General Compute",
};

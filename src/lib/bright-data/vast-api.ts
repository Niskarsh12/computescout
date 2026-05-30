import type { GpuType } from "@/domain/provider";
import { brightDataClient } from "./client";

interface BrightDataJsonResponse {
  status_code?: number;
  body?: string;
}

interface VastOffer {
  gpu_name?: string;
  dph_total?: number;
  num_gpus?: number;
  geolocation?: string;
}

interface VastBundlesResponse {
  offers?: VastOffer[];
}

const GPU_NAME_MAP: Record<string, GpuType> = {
  h100: "h100",
  a100: "a100",
  "4090": "rtx4090",
  "3090": "rtx3090",
  l40: "l40s",
};

export function mapGpuNameToType(gpuName: string): GpuType | null {
  const lower = gpuName.toLowerCase();
  for (const [needle, gpuType] of Object.entries(GPU_NAME_MAP)) {
    if (lower.includes(needle)) return gpuType;
  }
  return null;
}

export async function fetchVastMarketOffers(): Promise<VastOffer[]> {
  const result = await brightDataClient.scrape(
    "https://cloud.vast.ai/api/v0/bundles/",
    { format: "json" }
  );

  const wrapper = result.json as BrightDataJsonResponse | VastBundlesResponse;
  let payload: VastBundlesResponse;

  if (wrapper && "body" in wrapper && typeof wrapper.body === "string") {
    payload = JSON.parse(wrapper.body) as VastBundlesResponse;
  } else {
    payload = wrapper as VastBundlesResponse;
  }

  return payload.offers ?? [];
}

export function aggregateVastOffers(
  offers: VastOffer[],
  gpuTypes: GpuType[]
): Map<GpuType, { minPrice: number; count: number }> {
  const aggregated = new Map<GpuType, { minPrice: number; count: number }>();

  for (const offer of offers) {
    if (!offer.gpu_name || !offer.dph_total) continue;
    const gpuType = mapGpuNameToType(offer.gpu_name);
    if (!gpuType || !gpuTypes.includes(gpuType)) continue;
    if (offer.dph_total <= 0 || offer.dph_total > 50) continue;

    const existing = aggregated.get(gpuType);
    if (!existing) {
      aggregated.set(gpuType, {
        minPrice: offer.dph_total,
        count: offer.num_gpus ?? 1,
      });
    } else {
      aggregated.set(gpuType, {
        minPrice: Math.min(existing.minPrice, offer.dph_total),
        count: existing.count + (offer.num_gpus ?? 1),
      });
    }
  }

  return aggregated;
}

import type {
  NormalizedAvailability,
  NormalizedInventory,
  NormalizedPricing,
  NormalizedStatus,
} from "@/domain/market";
import { shouldUseMockData } from "../client";
import {
  buildPricingFromScrape,
  fetchPageHtml,
  seedPricing,
} from "../scrape-utils";
import { BaseProviderSource } from "./base";

const PRICING_URL = "https://www.runpod.io/pricing";

const PRICING_SEEDS = [
  { gpuType: "h100" as const, region: "us" as const, hourlyPrice: 2.89 },
  { gpuType: "a100" as const, region: "us" as const, hourlyPrice: 1.99 },
  { gpuType: "rtx4090" as const, region: "global" as const, hourlyPrice: 0.44 },
  { gpuType: "l40s" as const, region: "us" as const, hourlyPrice: 0.79 },
];

const FALLBACK_DATA = {
  inventory: [
    { gpuType: "h100" as const, region: "us" as const, availableCount: 24 },
    { gpuType: "a100" as const, region: "us" as const, availableCount: 48 },
    { gpuType: "rtx4090" as const, region: "global" as const, availableCount: 156 },
    { gpuType: "l40s" as const, region: "us" as const, availableCount: 32 },
  ],
  status: {
    status: "operational" as const,
    healthScore: 87,
    incidents: [],
    summary: "RunPod marketplace operating normally with strong GPU availability.",
  },
};

export class RunPodSource extends BaseProviderSource {
  readonly providerId = "runpod";

  async getPricing(): Promise<NormalizedPricing[]> {
    return this.safeFetch(async () => {
      if (shouldUseMockData()) {
        return seedPricing(this.providerId, PRICING_SEEDS);
      }

      const html = await fetchPageHtml(PRICING_URL);
      const pricing = buildPricingFromScrape(
        this.providerId,
        html,
        PRICING_SEEDS
      );

      if (pricing.some((p) => p.live)) return pricing;
      return seedPricing(this.providerId, PRICING_SEEDS);
    }, seedPricing(this.providerId, PRICING_SEEDS));
  }

  async getInventory(): Promise<NormalizedInventory[]> {
    return FALLBACK_DATA.inventory.map((inv) => ({
      providerId: this.providerId,
      ...inv,
    }));
  }

  async getAvailability(): Promise<NormalizedAvailability[]> {
    const inventory = await this.getInventory();
    return inventory.map((inv) => ({
      providerId: inv.providerId,
      gpuType: inv.gpuType,
      region: inv.region,
      available: inv.availableCount > 0,
      count: inv.availableCount,
    }));
  }

  async getStatus(): Promise<NormalizedStatus> {
    return this.safeFetch(async () => {
      if (!shouldUseMockData()) {
        try {
          await fetchPageHtml("https://status.runpod.io/");
        } catch {
          // Status page optional
        }
      }
      return { providerId: this.providerId, ...FALLBACK_DATA.status };
    }, { providerId: this.providerId, ...FALLBACK_DATA.status });
  }
}

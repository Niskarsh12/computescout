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

const PRICING_URLS = [
  "https://docs.nebius.com/compute/resources/pricing",
  "https://nebius.com/pricing",
  "https://nebius.com/cloud",
];

const PRICING_SEEDS = [
  { gpuType: "h100" as const, region: "europe" as const, hourlyPrice: 2.4 },
  { gpuType: "a100" as const, region: "europe" as const, hourlyPrice: 1.75 },
  { gpuType: "h100" as const, region: "eu-west" as const, hourlyPrice: 2.35 },
];

const FALLBACK_DATA = {
  inventory: [
    { gpuType: "h100" as const, region: "europe" as const, availableCount: 16 },
    { gpuType: "a100" as const, region: "europe" as const, availableCount: 32 },
    { gpuType: "h100" as const, region: "eu-west" as const, availableCount: 12 },
  ],
  status: {
    status: "operational" as const,
    healthScore: 92,
    incidents: [],
    summary: "Stable inventory and strong availability in Europe.",
  },
};

export class NebiusSource extends BaseProviderSource {
  readonly providerId = "nebius";

  async getPricing(): Promise<NormalizedPricing[]> {
    return this.safeFetch(async () => {
      if (shouldUseMockData()) {
        return seedPricing(this.providerId, PRICING_SEEDS);
      }

      for (const url of PRICING_URLS) {
        try {
          const html = await fetchPageHtml(url);
          const pricing = buildPricingFromScrape(
            this.providerId,
            html,
            PRICING_SEEDS
          );
          if (pricing.some((p) => p.live)) return pricing;
        } catch {
          continue;
        }
      }

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
    return { providerId: this.providerId, ...FALLBACK_DATA.status };
  }
}

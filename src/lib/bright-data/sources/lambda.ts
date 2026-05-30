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
  "https://lambdalabs.com/instances",
  "https://lambdalabs.com/service/gpu-cloud",
];

const PRICING_SEEDS = [
  { gpuType: "h100" as const, region: "us-west" as const, hourlyPrice: 2.99 },
  { gpuType: "a100" as const, region: "us-west" as const, hourlyPrice: 1.29 },
  { gpuType: "h100" as const, region: "us" as const, hourlyPrice: 2.89 },
];

const FALLBACK_DATA = {
  inventory: [
    { gpuType: "h100" as const, region: "us-west" as const, availableCount: 8 },
    { gpuType: "a100" as const, region: "us-west" as const, availableCount: 24 },
    { gpuType: "h100" as const, region: "us" as const, availableCount: 6 },
  ],
  status: {
    status: "operational" as const,
    healthScore: 91,
    incidents: [],
    summary:
      "Lambda Cloud instances available. Pricing page is JS-rendered; seed data used when scrape unavailable.",
  },
};

export class LambdaSource extends BaseProviderSource {
  readonly providerId = "lambda";

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

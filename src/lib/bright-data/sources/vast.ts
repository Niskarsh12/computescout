import type {
  NormalizedAvailability,
  NormalizedInventory,
  NormalizedPricing,
  NormalizedStatus,
} from "@/domain/market";
import { shouldUseMockData } from "../client";
import { seedPricing } from "../scrape-utils";
import { aggregateVastOffers, fetchVastMarketOffers } from "../vast-api";
import { BaseProviderSource } from "./base";

const PRICING_SEEDS = [
  { gpuType: "rtx4090" as const, region: "global" as const, hourlyPrice: 0.34 },
  { gpuType: "rtx3090" as const, region: "global" as const, hourlyPrice: 0.18 },
  { gpuType: "a100" as const, region: "global" as const, hourlyPrice: 1.45 },
];

const FALLBACK_DATA = {
  inventory: [
    { gpuType: "rtx4090" as const, region: "global" as const, availableCount: 142 },
    { gpuType: "rtx3090" as const, region: "global" as const, availableCount: 89 },
    { gpuType: "a100" as const, region: "global" as const, availableCount: 23 },
  ],
  status: {
    status: "operational" as const,
    healthScore: 78,
    incidents: [],
    summary: "Vast.ai marketplace active with competitive spot pricing.",
  },
};

export class VastSource extends BaseProviderSource {
  readonly providerId = "vast";

  async getPricing(): Promise<NormalizedPricing[]> {
    return this.safeFetch(async () => {
      if (shouldUseMockData()) {
        return seedPricing(this.providerId, PRICING_SEEDS);
      }

      const offers = await fetchVastMarketOffers();
      const aggregated = aggregateVastOffers(
        offers,
        PRICING_SEEDS.map((s) => s.gpuType)
      );

      const pricing = PRICING_SEEDS.map((seed) => {
        const live = aggregated.get(seed.gpuType);
        return {
          providerId: this.providerId,
          gpuType: seed.gpuType,
          region: seed.region,
          hourlyPrice: live ? roundPrice(live.minPrice) : seed.hourlyPrice,
          live: Boolean(live),
        };
      });

      if (pricing.some((p) => p.live)) return pricing;
      return seedPricing(this.providerId, PRICING_SEEDS);
    }, seedPricing(this.providerId, PRICING_SEEDS));
  }

  async getInventory(): Promise<NormalizedInventory[]> {
    return this.safeFetch(async () => {
      if (shouldUseMockData()) {
        return FALLBACK_DATA.inventory.map((inv) => ({
          providerId: this.providerId,
          ...inv,
        }));
      }

      try {
        const offers = await fetchVastMarketOffers();
        const aggregated = aggregateVastOffers(
          offers,
          PRICING_SEEDS.map((s) => s.gpuType)
        );

        return PRICING_SEEDS.map((seed, i) => ({
          providerId: this.providerId,
          gpuType: seed.gpuType,
          region: seed.region,
          availableCount:
            aggregated.get(seed.gpuType)?.count ??
            FALLBACK_DATA.inventory[i].availableCount,
        }));
      } catch {
        return FALLBACK_DATA.inventory.map((inv) => ({
          providerId: this.providerId,
          ...inv,
        }));
      }
    }, FALLBACK_DATA.inventory.map((inv) => ({
      providerId: this.providerId,
      ...inv,
    })));
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

function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

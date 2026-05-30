import type {
  NormalizedAvailability,
  NormalizedInventory,
  NormalizedPricing,
  NormalizedStatus,
} from "@/domain/market";
import { BaseProviderSource } from "./base";

interface MockProviderConfig {
  providerId: string;
  pricing: NormalizedPricing[];
  inventory: NormalizedInventory[];
  status: Omit<NormalizedStatus, "providerId">;
}

const MOCK_PROVIDERS: MockProviderConfig[] = [
  {
    providerId: "tensordock",
    pricing: [
      { providerId: "tensordock", gpuType: "a100", region: "us", hourlyPrice: 1.65, live: false },
      { providerId: "tensordock", gpuType: "rtx4090", region: "us", hourlyPrice: 0.52, live: false },
      { providerId: "tensordock", gpuType: "a100", region: "europe", hourlyPrice: 1.72, live: false },
    ],
    inventory: [
      { providerId: "tensordock", gpuType: "a100", region: "us", availableCount: 18 },
      { providerId: "tensordock", gpuType: "rtx4090", region: "us", availableCount: 42 },
    ],
    status: {
      status: "operational",
      healthScore: 82,
      incidents: [],
      summary: "TensorDock offering competitive A100 pricing in US and EU.",
    },
  },
  {
    providerId: "crusoe",
    pricing: [
      { providerId: "crusoe", gpuType: "h100", region: "us", hourlyPrice: 2.10, live: false },
      { providerId: "crusoe", gpuType: "a100", region: "us", hourlyPrice: 1.55, live: false },
    ],
    inventory: [
      { providerId: "crusoe", gpuType: "h100", region: "us", availableCount: 12 },
      { providerId: "crusoe", gpuType: "a100", region: "us", availableCount: 20 },
    ],
    status: {
      status: "operational",
      healthScore: 85,
      incidents: [],
      summary: "Crusoe sustainable compute with strong H100 availability.",
    },
  },
  {
    providerId: "coreweave",
    pricing: [
      { providerId: "coreweave", gpuType: "h100", region: "us", hourlyPrice: 2.69, live: false },
      { providerId: "coreweave", gpuType: "a100", region: "europe", hourlyPrice: 1.89, live: false },
    ],
    inventory: [
      { providerId: "coreweave", gpuType: "h100", region: "us", availableCount: 48 },
      { providerId: "coreweave", gpuType: "a100", region: "europe", availableCount: 36 },
    ],
    status: {
      status: "operational",
      healthScore: 94,
      incidents: [],
      summary: "CoreWeave enterprise-grade infrastructure with high reliability.",
    },
  },
  {
    providerId: "together",
    pricing: [
      { providerId: "together", gpuType: "h100", region: "us", hourlyPrice: 2.75, live: false },
      { providerId: "together", gpuType: "a100", region: "us", hourlyPrice: 1.95, live: false },
    ],
    inventory: [
      { providerId: "together", gpuType: "h100", region: "us", availableCount: 14 },
      { providerId: "together", gpuType: "a100", region: "us", availableCount: 28 },
    ],
    status: {
      status: "operational",
      healthScore: 88,
      incidents: [],
      summary: "Together AI inference-optimized infrastructure.",
    },
  },
];

export class MockProviderSource extends BaseProviderSource {
  readonly providerId: string;
  private config: MockProviderConfig;

  constructor(config: MockProviderConfig) {
    super();
    this.providerId = config.providerId;
    this.config = config;
  }

  async getPricing(): Promise<NormalizedPricing[]> {
    return this.config.pricing;
  }

  async getInventory(): Promise<NormalizedInventory[]> {
    return this.config.inventory;
  }

  async getAvailability(): Promise<NormalizedAvailability[]> {
    return this.config.inventory.map((inv) => ({
      providerId: inv.providerId,
      gpuType: inv.gpuType,
      region: inv.region,
      available: inv.availableCount > 0,
      count: inv.availableCount,
    }));
  }

  async getStatus(): Promise<NormalizedStatus> {
    return { providerId: this.providerId, ...this.config.status };
  }
}

export function createMockSources(): MockProviderSource[] {
  return MOCK_PROVIDERS.map((config) => new MockProviderSource(config));
}

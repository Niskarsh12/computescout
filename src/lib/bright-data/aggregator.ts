import { getProviderById } from "@/domain/provider";
import type { MarketEntry, MarketSnapshot } from "@/domain/market";
import type { ProviderHealth } from "@/domain/provider";
import type { ProviderDataSource } from "./sources/base";
import { LambdaSource } from "./sources/lambda";
import { createMockSources } from "./sources/mock";
import { NebiusSource } from "./sources/nebius";
import { RunPodSource } from "./sources/runpod";
import { VastSource } from "./sources/vast";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedSnapshot: MarketSnapshot | null = null;
let cacheTimestamp = 0;

function getAllSources(): ProviderDataSource[] {
  return [
    new RunPodSource(),
    new VastSource(),
    new NebiusSource(),
    new LambdaSource(),
    ...createMockSources(),
  ];
}

async function fetchFromSource(source: ProviderDataSource): Promise<MarketEntry[]> {
  const [pricing, inventory, status] = await Promise.all([
    source.getPricing(),
    source.getInventory(),
    source.getStatus(),
  ]);

  const entries: MarketEntry[] = [];

  for (const price of pricing) {
    const provider = getProviderById(price.providerId);
    if (!provider) continue;

    const inv = inventory.find(
      (i) =>
        i.providerId === price.providerId &&
        i.gpuType === price.gpuType &&
        i.region === price.region
    );

    entries.push({
      provider,
      gpuType: price.gpuType,
      region: price.region,
      hourlyPrice: price.hourlyPrice,
      availability: inv?.availableCount ?? 0,
      healthScore: status.healthScore,
      status: status.status,
      lastUpdated: new Date(),
      dataSource: price.live ? "live" : "seed",
    });
  }

  return entries;
}

export async function fetchMarketSnapshot(
  forceRefresh = false
): Promise<MarketSnapshot> {
  const now = Date.now();
  if (!forceRefresh && cachedSnapshot && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  const sources = getAllSources();
  const results = await Promise.allSettled(
    sources.map((source) => fetchFromSource(source))
  );

  const entries: MarketEntry[] = [];
  let live = 0;
  let seed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const entry of result.value) {
        entries.push(entry);
        if (entry.dataSource === "live") live++;
        else seed++;
      }
    }
  }

  const snapshot: MarketSnapshot = {
    entries,
    fetchedAt: new Date(),
    sourceBreakdown: { live, seed },
  };

  cachedSnapshot = snapshot;
  cacheTimestamp = now;

  return snapshot;
}

export async function fetchProviderHealth(
  providerId: string
): Promise<ProviderHealth | null> {
  const sources = getAllSources();
  const source = sources.find((s) => s.providerId === providerId);
  if (!source) return null;

  const [status, inventory] = await Promise.all([
    source.getStatus(),
    source.getInventory(),
  ]);

  const totalAvailable = inventory.reduce(
    (sum, inv) => sum + inv.availableCount,
    0
  );

  let availabilityLevel: "high" | "medium" | "low" = "low";
  if (totalAvailable >= 20) availabilityLevel = "high";
  else if (totalAvailable >= 5) availabilityLevel = "medium";

  return {
    providerId,
    score: status.healthScore,
    status: status.status,
    recentIncidents: status.incidents.map((inc, i) => ({
      id: `${providerId}-inc-${i}`,
      title: inc.title,
      severity: inc.severity,
      startedAt: inc.startedAt,
      resolvedAt: inc.resolvedAt,
    })),
    priceTrend: "stable",
    availabilityLevel,
    summary: status.summary,
    lastUpdated: new Date(),
  };
}

export async function fetchProviderEntries(
  providerId: string
): Promise<MarketEntry[]> {
  const snapshot = await fetchMarketSnapshot();
  return snapshot.entries.filter((e) => e.provider.id === providerId);
}

export function clearMarketCache(): void {
  cachedSnapshot = null;
  cacheTimestamp = 0;
}

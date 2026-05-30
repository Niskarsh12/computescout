"use server";

import {
  fetchMarketSnapshot,
  fetchProviderEntries,
  fetchProviderHealth,
  clearMarketCache,
} from "@/lib/bright-data/aggregator";
import type { MarketSnapshot } from "@/domain/market";
import type { ProviderHealth } from "@/domain/provider";
import type { MarketEntry } from "@/domain/market";
import { revalidatePath } from "next/cache";

export async function getMarketRadarAction(
  forceRefresh = false
): Promise<MarketSnapshot> {
  return fetchMarketSnapshot(forceRefresh);
}

export async function refreshMarketRadarAction(): Promise<void> {
  clearMarketCache();
  revalidatePath("/radar");
}

export async function getProviderDetailAction(slug: string): Promise<{
  health: ProviderHealth | null;
  entries: MarketEntry[];
}> {
  const [health, entries] = await Promise.all([
    fetchProviderHealth(slug),
    fetchProviderEntries(slug),
  ]);
  return { health, entries };
}

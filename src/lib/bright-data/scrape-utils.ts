import type { GpuType, Region } from "@/domain/provider";
import type { NormalizedPricing } from "@/domain/market";
import { brightDataClient } from "./client";

const GPU_PRICE_BOUNDS: Record<GpuType, { min: number; max: number }> = {
  h100: { min: 0.5, max: 12 },
  a100: { min: 0.4, max: 8 },
  "a100-80gb": { min: 0.5, max: 9 },
  l40s: { min: 0.3, max: 4 },
  rtx4090: { min: 0.15, max: 2.5 },
  rtx3090: { min: 0.1, max: 1.5 },
  v100: { min: 0.2, max: 3 },
  mi300x: { min: 1.5, max: 12 },
};

const GPU_SEARCH_TERMS: Record<GpuType, string[]> = {
  h100: ["H100", "h100"],
  a100: ["A100", "a100"],
  "a100-80gb": ["A100 80GB", "A100-80GB"],
  l40s: ["L40S", "L40s", "l40s"],
  rtx4090: ["RTX 4090", "RTX4090", "4090"],
  rtx3090: ["RTX 3090", "RTX3090", "3090"],
  v100: ["V100", "v100"],
  mi300x: ["MI300X", "MI300"],
};

function isValidGpuPrice(gpuType: GpuType, price: number): boolean {
  const bounds = GPU_PRICE_BOUNDS[gpuType];
  return price >= bounds.min && price <= bounds.max;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectPrices(
  html: string,
  gpuType: GpuType,
  candidates: number[]
): void {
  const terms = GPU_SEARCH_TERMS[gpuType];

  for (const term of terms) {
    const escaped = escapeRegex(term);
    const patterns = [
      new RegExp(`${escaped}[^$]{0,200}\\$\\s*(\\d+(?:\\.\\d{1,2})?)`, "gi"),
      new RegExp(`${escaped}[^$]{0,200}(\\d+(?:\\.\\d{1,2})?)\\s*(?:USD\\s*)?(?:\\/\\s*h|per\\s*hour|\\/hr)`, "gi"),
      new RegExp(`\\$\\s*(\\d+(?:\\.\\d{1,2})?)[^$]{0,120}${escaped}`, "gi"),
      new RegExp(`${escaped}[^$]{0,80}from\\s+\\$(\\d+(?:\\.\\d{1,2})?)`, "gi"),
    ];

    for (const pattern of patterns) {
      for (const match of html.matchAll(pattern)) {
        const price = parseFloat(match[1]);
        if (!isNaN(price) && isValidGpuPrice(gpuType, price)) {
          candidates.push(price);
        }
      }
    }
  }
}

function extractFromJsonLd(html: string, gpuType: GpuType): number | null {
  const candidates: number[] = [];
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of scripts) {
    collectPrices(match[1], gpuType, candidates);
    try {
      const json = JSON.parse(match[1]) as unknown;
      collectPrices(JSON.stringify(json), gpuType, candidates);
    } catch {
      // ignore invalid JSON blocks
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a - b);
  return candidates[0];
}

export function extractGpuPrice(html: string, gpuType: GpuType): number | null {
  const candidates: number[] = [];

  collectPrices(html, gpuType, candidates);

  const fromJson = extractFromJsonLd(html, gpuType);
  if (fromJson !== null) candidates.push(fromJson);

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a - b);
  return candidates[0];
}

export async function fetchPageHtml(url: string): Promise<string> {
  const result = await brightDataClient.scrape(url);
  const html = result.html ?? "";
  if (!html || html.length < 200) {
    throw new Error(`Empty or invalid response from ${url}`);
  }
  return html;
}

interface PricingSeed {
  gpuType: GpuType;
  region: Region;
  hourlyPrice: number;
}

export function buildPricingFromScrape(
  providerId: string,
  html: string,
  seeds: PricingSeed[]
): NormalizedPricing[] {
  return seeds.map((seed) => {
    const scraped = extractGpuPrice(html, seed.gpuType);
    return {
      providerId,
      gpuType: seed.gpuType,
      region: seed.region,
      hourlyPrice: scraped ?? seed.hourlyPrice,
      live: scraped !== null,
    };
  });
}

export function seedPricing(
  providerId: string,
  seeds: PricingSeed[]
): NormalizedPricing[] {
  return seeds.map((seed) => ({
    providerId,
    ...seed,
    live: false,
  }));
}

export function countLivePricing(pricing: NormalizedPricing[]): number {
  return pricing.filter((p) => p.live).length;
}

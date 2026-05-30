import type {
  NormalizedAvailability,
  NormalizedInventory,
  NormalizedPricing,
  NormalizedStatus,
} from "@/domain/market";

export interface ProviderDataSource {
  readonly providerId: string;

  getPricing(): Promise<NormalizedPricing[]>;
  getInventory(): Promise<NormalizedInventory[]>;
  getAvailability(): Promise<NormalizedAvailability[]>;
  getStatus(): Promise<NormalizedStatus>;
}

export abstract class BaseProviderSource implements ProviderDataSource {
  abstract readonly providerId: string;

  abstract getPricing(): Promise<NormalizedPricing[]>;
  abstract getInventory(): Promise<NormalizedInventory[]>;
  abstract getAvailability(): Promise<NormalizedAvailability[]>;
  abstract getStatus(): Promise<NormalizedStatus>;

  protected async safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`[${this.providerId}] fetch failed:`, error);
      return fallback;
    }
  }
}

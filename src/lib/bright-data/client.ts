interface BrightDataConfig {
  apiToken: string;
  zone: string;
}

interface ScrapeResult {
  html?: string;
  json?: unknown;
  status: number;
}

function getConfig(): BrightDataConfig {
  return {
    apiToken: process.env.BRIGHT_DATA_API_TOKEN ?? "",
    zone: process.env.BRIGHT_DATA_ZONE ?? "web_unlocker1",
  };
}

export class BrightDataClient {
  get isConfigured(): boolean {
    return getConfig().apiToken.length > 0;
  }

  async scrape(url: string, options?: { format?: "html" | "json" }): Promise<ScrapeResult> {
    const config = getConfig();

    if (!config.apiToken) {
      throw new Error("Bright Data API token not configured");
    }

    const response = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zone: config.zone,
        url,
        format: options?.format ?? "raw",
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Bright Data request failed: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = await response.json();
      return { json, status: response.status };
    }

    const html = await response.text();
    return { html, status: response.status };
  }
}

export const brightDataClient = new BrightDataClient();

export function shouldUseMockData(): boolean {
  if (process.env.USE_MOCK_MARKET_DATA === "true") return true;
  return !brightDataClient.isConfigured;
}

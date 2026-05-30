import { getMarketRadarAction } from "@/actions/radar";
import { PageHeader } from "@/components/layout/header";
import { StatCard } from "@/components/layout/primitives";
import { RadarTable } from "@/components/radar/radar-table";
import { timeAgo } from "@/lib/utils";
import { RefreshButton } from "./refresh-button";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function RadarPage() {
  const snapshot = await getMarketRadarAction();
  const providers = new Set(snapshot.entries.map((e) => e.provider.id)).size;

  return (
    <div className="animate-fade-up">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Market Intelligence"
          title="Global Compute Radar"
          description="Live GPU pricing across major providers. Green = scraped via Bright Data. Gray = seed estimate."
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-4">
          <span className="text-xs text-muted">
            Updated {timeAgo(snapshot.fetchedAt)}
          </span>
          <RefreshButton />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Live prices"
          value={snapshot.sourceBreakdown.live}
          highlight
        />
        <StatCard
          label="Seed prices"
          value={snapshot.sourceBreakdown.seed}
        />
        <StatCard
          label="Providers"
          value={providers}
        />
        <StatCard
          label="Entries"
          value={snapshot.entries.length}
        />
      </div>

      <RadarTable entries={snapshot.entries} />
    </div>
  );
}

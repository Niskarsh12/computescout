import { notFound } from "next/navigation";
import Link from "next/link";
import { getProviderDetailAction } from "@/actions/radar";
import { getProviderBySlug } from "@/domain/provider";
import { PageHeader, SectionLabel, StatusDot } from "@/components/layout/header";
import { StatCard } from "@/components/layout/primitives";
import { RadarTable } from "@/components/radar/radar-table";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ProviderPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);

  if (!provider) {
    notFound();
  }

  const { health, entries } = await getProviderDetailAction(slug);
  const livePrices = entries.filter((e) => e.dataSource === "live").length;

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="px-0 text-muted hover:text-foreground">
          <Link href="/radar">← Radar</Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Provider Intelligence"
        title={provider.name}
        description={`${provider.website.replace("https://", "")} · ${livePrices}/${entries.length} live prices`}
      />

      {health && (
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Health"
            value={
              <StatusDot status={health.status} score={health.score} />
            }
          />
          <StatCard
            label="Availability"
            value={
              health.availabilityLevel.charAt(0).toUpperCase() +
              health.availabilityLevel.slice(1)
            }
          />
          <StatCard
            label="Price trend"
            value={
              health.priceTrend.charAt(0).toUpperCase() +
              health.priceTrend.slice(1)
            }
          />
          <StatCard
            label="Updated"
            value={timeAgo(health.lastUpdated)}
          />
        </div>
      )}

      <div className="mb-12 card p-6">
        <SectionLabel>Market Summary</SectionLabel>
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/90">
          {health?.summary ?? "No summary available."}
        </p>
      </div>

      <div className="mb-12">
        <SectionLabel>Recent Incidents</SectionLabel>
        {health && health.recentIncidents.length > 0 ? (
          <ul className="space-y-3">
            {health.recentIncidents.map((inc) => (
              <li key={inc.id} className="border-l-2 border-warning pl-4 text-sm">
                <span className="font-medium">{inc.title}</span>
                <span className="ml-2 text-xs uppercase text-muted">
                  {inc.severity}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">None in the last 30 days</p>
        )}
      </div>

      <div>
        <SectionLabel>Current Inventory</SectionLabel>
        {entries.length > 0 ? (
          <RadarTable entries={entries} />
        ) : (
          <p className="text-sm text-muted">No inventory data available.</p>
        )}
      </div>
    </div>
  );
}

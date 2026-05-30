import Link from "next/link";
import { AnalysisForm } from "@/components/analysis/analysis-form";
import { PipelineBar } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="animate-fade-up">
      <div className="max-w-3xl">
        <p className="eyebrow mb-4">Infrastructure Intelligence</p>
        <h1 className="text-4xl font-medium tracking-tight leading-[1.1] md:text-5xl lg:text-[3.25rem]">
          Find the best place on Earth to run your workload.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          ComputeScout monitors the global GPU compute market and recommends
          where to run training, fine-tuning, and inference — with live pricing,
          deterministic scoring, and zero AI guesswork.
        </p>
        <div className="mt-8">
          <PipelineBar />
        </div>
      </div>

      <div className="mt-12 max-w-2xl">
        <div className="card-elevated p-6 md:p-8">
          <AnalysisForm compact />
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Providers", value: "8+" },
          { label: "Live pricing", value: "4" },
          { label: "GPU types", value: "6" },
          { label: "Regions", value: "Global" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 md:p-5">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 grid grid-cols-1 gap-12 border-t border-border pt-16 md:grid-cols-3">
        <div>
          <h3 className="eyebrow mb-3">Market Intelligence</h3>
          <p className="text-sm leading-relaxed text-foreground/80">
            Live pricing scraped via Bright Data from RunPod, Nebius, Vast.ai,
            and Lambda. One radar. One source of truth.
          </p>
        </div>
        <div>
          <h3 className="eyebrow mb-3">Deterministic Scoring</h3>
          <p className="text-sm leading-relaxed text-foreground/80">
            Recommendations ranked on price, availability, reliability, and
            region. The engine decides — Groq only parses and explains.
          </p>
        </div>
        <div>
          <h3 className="eyebrow mb-3">Global Radar</h3>
          <p className="text-sm leading-relaxed text-foreground/80">
            Bloomberg-style compute market table. Green is live. Gray is seed.
            Honest about both.
          </p>
          <Button asChild variant="link" className="mt-4 h-auto p-0 text-sm">
            <Link href="/radar">Open Radar →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

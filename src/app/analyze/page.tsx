import Link from "next/link";
import { AnalysisForm } from "@/components/analysis/analysis-form";
import { PageHeader } from "@/components/layout/header";
import { PipelineBar } from "@/components/layout/primitives";

export default function AnalyzePage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Compute Analysis"
        title="Analyze Workload"
        description="Configure requirements or use natural language. The engine scores providers deterministically — Groq parses and explains only."
      />
      <div className="mb-8">
        <PipelineBar />
      </div>
      <div className="max-w-xl">
        <div className="card-elevated p-6 md:p-8">
          <AnalysisForm />
        </div>
      </div>
      <p className="mt-6 text-xs text-muted">
        <Link href="/" className="hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

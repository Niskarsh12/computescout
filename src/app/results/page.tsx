import Link from "next/link";
import { ResultsView } from "@/components/results/results-view";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
  return (
    <div>
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="px-0 text-muted hover:text-foreground">
          <Link href="/analyze">← New analysis</Link>
        </Button>
      </div>
      <ResultsView />
    </div>
  );
}

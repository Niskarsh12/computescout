"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshMarketRadarAction } from "@/actions/radar";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await refreshMarketRadarAction();
          router.refresh();
        });
      }}
    >
      {isPending ? "Refreshing..." : "Refresh"}
    </Button>
  );
}

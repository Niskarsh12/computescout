import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-2xl font-medium">Not Found</h1>
      <p className="mt-2 text-muted text-sm">
        The page or provider you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}

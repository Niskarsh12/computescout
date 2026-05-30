import { NextResponse } from "next/server";
import { getProviderDetailAction } from "@/actions/radar";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const detail = await getProviderDetailAction(slug);
  return NextResponse.json(detail);
}

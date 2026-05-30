import { NextResponse } from "next/server";
import { getMarketRadarAction } from "@/actions/radar";

export const maxDuration = 60;

export async function GET() {
  const snapshot = await getMarketRadarAction();
  return NextResponse.json(snapshot);
}

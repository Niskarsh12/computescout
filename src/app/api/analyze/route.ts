import { NextResponse } from "next/server";
import { analyzeWorkloadAction } from "@/actions/analyze";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
  const result = await analyzeWorkloadAction(body);
  return NextResponse.json(result);
}

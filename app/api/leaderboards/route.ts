import { NextResponse } from "next/server";
import { getAppSnapshot } from "@/lib/data-store";

export async function GET() {
  return NextResponse.json(await getAppSnapshot());
}

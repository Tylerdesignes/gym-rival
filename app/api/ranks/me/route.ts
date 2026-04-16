import { NextResponse } from "next/server";
import { getRankForUser } from "@/lib/data-store";

export async function GET() {
  try {
    return NextResponse.json(await getRankForUser("user-demo"));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch rank." },
      { status: 400 }
    );
  }
}

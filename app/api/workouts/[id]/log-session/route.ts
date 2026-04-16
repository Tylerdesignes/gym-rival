import { NextResponse } from "next/server";
import { logWorkoutSession } from "@/lib/data-store";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await logWorkoutSession(payload.userId, payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to log workout session." },
      { status: 400 }
    );
  }
}

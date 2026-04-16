import { NextResponse } from "next/server";
import { generatePlanForUser } from "@/lib/data-store";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const plan = await generatePlanForUser(payload.userId, payload.daysPerWeek, payload.goal);
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate plan." },
      { status: 400 }
    );
  }
}

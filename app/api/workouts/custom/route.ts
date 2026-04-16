import { NextResponse } from "next/server";
import { createCustomPlan } from "@/lib/data-store";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const plan = await createCustomPlan(payload);
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create custom workout plan." },
      { status: 400 }
    );
  }
}

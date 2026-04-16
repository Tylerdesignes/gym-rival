import { NextResponse } from "next/server";
import { joinChallenge } from "@/lib/data-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await request.json();
    const params = await context.params;
    return NextResponse.json(await joinChallenge(params.id, payload.userId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to join challenge." },
      { status: 400 }
    );
  }
}

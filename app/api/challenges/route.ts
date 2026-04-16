import { NextResponse } from "next/server";
import { createChallenge } from "@/lib/data-store";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return NextResponse.json(await createChallenge(payload));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create challenge." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { createBaselineAssessment, getAppSnapshot } from "@/lib/data-store";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await createBaselineAssessment(payload);

    return NextResponse.json({
      assessmentId: result.assessment.id,
      summary: result.assessment.summary,
      rankResult: result.rankResult,
      snapshot: await getAppSnapshot()
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create baseline assessment." },
      { status: 400 }
    );
  }
}

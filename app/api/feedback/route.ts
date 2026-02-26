import { NextRequest, NextResponse } from "next/server";
import { makeFeedbackService } from "@/src/application/feedback/feedback.factory";
import { feedbackSchema } from "@/src/domain/feedback/feedback.validations";
import { AppError } from "@/src/application/shared/app-error";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = feedbackSchema.parse(body);

    const service = makeFeedbackService();
    const feedback = await service.createFeedback(validatedData);

    return NextResponse.json({ success: true, data: feedback }, { status: 201 });
  } catch (error) {
    console.error("Error in feedback API:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      { error: isDev ? message : "Internal server error" },
      { status: 500 }
    );
  }
}


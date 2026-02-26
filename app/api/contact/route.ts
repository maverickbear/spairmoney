import { NextRequest, NextResponse } from "next/server";
import { makeContactService } from "@/src/application/contact/contact.factory";
import { contactFormSchema } from "@/src/domain/contact/contact.validations";
import { AppError } from "@/src/application/shared/app-error";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = contactFormSchema.parse(body);

    const service = makeContactService();
    const contact = await service.createContact(validatedData);

    try {
      const { sendContactConfirmationEmail, sendNewContactNotificationEmail } = await import("@/lib/utils/email");
      await sendContactConfirmationEmail({
        to: validatedData.email,
        name: validatedData.name,
        subject: validatedData.subject,
      });
      await sendNewContactNotificationEmail({
        fromName: validatedData.name,
        fromEmail: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
      });
    } catch (emailError) {
      console.error("[CONTACT] Error sending contact emails (non-critical):", emailError);
    }

    return NextResponse.json({ success: true, data: contact }, { status: 201 });
  } catch (error) {
    console.error("Error in contact form API:", error);
    
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

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { getSecurities, createSecurity } from "@/lib/api/investments";
import { securitySchema } from "@/lib/validations/security";

export async function GET() {
  try {
    const securities = await getSecurities();
    return NextResponse.json(securities);
  } catch (error) {
    console.error("Error fetching securities:", error);
    return NextResponse.json(
      { error: "Failed to fetch securities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = securitySchema.parse(body);
    const security = await createSecurity(validated);
    return NextResponse.json(security, { status: 201 });
  } catch (error) {
    console.error("Error creating security:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create security";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


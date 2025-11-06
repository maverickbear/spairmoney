import { NextResponse } from "next/server";
import {
  getAccountInvestmentValue,
  upsertAccountInvestmentValue,
} from "@/lib/api/simple-investments";
import { z } from "zod";

const updateValueSchema = z.object({
  totalValue: z.number().positive(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const value = await getAccountInvestmentValue(id);
    return NextResponse.json(value);
  } catch (error) {
    console.error("Error fetching account investment value:", error);
    return NextResponse.json(
      { error: "Failed to fetch value" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateValueSchema.parse(body);
    const value = await upsertAccountInvestmentValue({
      accountId: id,
      totalValue: validated.totalValue,
    });
    return NextResponse.json(value);
  } catch (error) {
    console.error("Error updating account investment value:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update value";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


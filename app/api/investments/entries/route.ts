import { NextResponse } from "next/server";
import {
  getSimpleInvestmentEntries,
  createSimpleInvestmentEntry,
} from "@/lib/api/simple-investments";
import { z } from "zod";

const createEntrySchema = z.object({
  accountId: z.string().min(1),
  date: z.string().or(z.date()),
  type: z.enum(["contribution", "dividend", "interest", "initial"]),
  amount: z.number().positive(),
  description: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || undefined;

    const entries = await getSimpleInvestmentEntries(accountId);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching simple investment entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = {
      ...body,
      date: body.date instanceof Date ? body.date : new Date(body.date),
    };
    const validated = createEntrySchema.parse(data);
    const entry = await createSimpleInvestmentEntry(validated);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating simple investment entry:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create entry";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


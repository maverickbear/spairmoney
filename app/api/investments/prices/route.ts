import { NextResponse } from "next/server";
import { getSecurityPrices, createSecurityPrice } from "@/lib/api/investments";
import { securityPriceSchema } from "@/lib/validations/investment";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const securityId = searchParams.get("securityId") || undefined;
    const prices = await getSecurityPrices(securityId);
    return NextResponse.json(prices);
  } catch (error) {
    console.error("Error fetching security prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch security prices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = {
      ...body,
      date: new Date(body.date),
    };
    const validated = securityPriceSchema.parse(data);
    const price = await createSecurityPrice(validated);
    return NextResponse.json(price, { status: 201 });
  } catch (error) {
    console.error("Error creating security price:", error);
    const message = error instanceof Error ? error.message : "Failed to create security price";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}


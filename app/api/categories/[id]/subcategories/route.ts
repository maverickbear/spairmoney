import { NextResponse } from "next/server";
import { createSubcategory } from "@/lib/api/categories";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const subcategory = await createSubcategory({
      name: data.name,
      categoryId: id,
    });
    return NextResponse.json(subcategory);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create subcategory" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { getMacros, getCategoriesByMacro, getSubcategoriesByCategory, createCategory } from "@/lib/api/categories";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const macroId = searchParams.get("macroId");
    const categoryId = searchParams.get("categoryId");

    if (categoryId) {
      const subcategories = await getSubcategoriesByCategory(categoryId);
      return NextResponse.json(subcategories);
    }

    if (macroId) {
      const categories = await getCategoriesByMacro(macroId);
      return NextResponse.json(categories);
    }

    const macros = await getMacros();
    return NextResponse.json(macros);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const category = await createCategory({
      name: data.name,
      macroId: data.macroId,
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}


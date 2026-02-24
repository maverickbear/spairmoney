import { NextRequest, NextResponse } from "next/server";
import { makeCategoriesService } from "@/src/application/categories/categories.factory";
import { getCurrentUserId, guardWriteAccess, throwIfNotAllowed } from "@/src/application/shared/feature-guard";
import { getActiveHouseholdId } from "@/lib/utils/household";
import { AppError } from "@/src/application/shared/app-error";
import { getCacheHeaders } from "@/src/infrastructure/utils/cache-headers";
import { revalidateTag } from 'next/cache';

function getLocaleFromRequest(request: NextRequest): string | undefined {
  const queryLocale = request.nextUrl.searchParams.get("locale");
  if (queryLocale === "en" || queryLocale === "pt" || queryLocale === "es") return queryLocale;
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return undefined;
  const first = acceptLanguage.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  if (first === "pt" || first === "es") return first;
  return undefined;
}

/**
 * GET /api/v2/categories/[id]
 * Returns a single category with subcategories. Used when editing to load fresh data from DB.
 * Only returns system categories or categories in the current user's household (or legacy user-owned).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const locale = getLocaleFromRequest(request);
    const service = makeCategoriesService();
    const category = await service.getCategoryById(id, locale);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const householdId = await getActiveHouseholdId(userId);
    const canAccess =
      category.isSystem === true ||
      (category.householdId != null && category.householdId === householdId);
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subcategories = await service.getSubcategoriesByCategory(id, locale);
    const categoryWithSubcategories = {
      ...category,
      subcategories: subcategories.map((s) => ({ id: s.id, name: s.name, logo: s.logo ?? null })),
    };

    const cacheHeaders = getCacheHeaders("static");
    return NextResponse.json(categoryWithSubcategories, {
      status: 200,
      headers: cacheHeaders,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can perform write operations
    const writeGuard = await guardWriteAccess(userId);
    await throwIfNotAllowed(writeGuard);

    const { id } = await params;
    const body = await request.json();
    const { name, type } = body;

    const service = makeCategoriesService();
    const category = await service.updateCategory(id, { 
      name,
      type: type || undefined
    });
    
    // Invalidate cache
    revalidateTag('categories', 'max');
    
    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error("Error updating category:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can perform write operations
    const writeGuard = await guardWriteAccess(userId);
    await throwIfNotAllowed(writeGuard);

    const { id } = await params;
    
    const service = makeCategoriesService();
    await service.deleteCategory(id);
    
    // Invalidate cache
    revalidateTag('categories', 'max');
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting category:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete category" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { makeCategoriesService } from "@/src/application/categories/categories.factory";
import { categorySchema } from "@/src/domain/categories/categories.validations";
import { getCurrentUserId, guardWriteAccess, throwIfNotAllowed } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";
import { getCacheHeaders } from "@/src/infrastructure/utils/cache-headers";
import { revalidateTag } from 'next/cache';


/** Parse locale from Accept-Language header or query (e.g. ?locale=pt). Values: en, pt, es. */
function getLocaleFromRequest(request: NextRequest): string | undefined {
  const queryLocale = request.nextUrl.searchParams.get("locale");
  if (queryLocale === "en" || queryLocale === "pt" || queryLocale === "es") return queryLocale;
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return undefined;
  const first = acceptLanguage.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  if (first === "pt" || first === "es") return first;
  return undefined; // en or any other: use default (name column)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const all = searchParams.get("all");
    const locale = getLocaleFromRequest(request);

    const service = makeCategoriesService();

    const cacheHeaders = getCacheHeaders('static');

    // If "all" parameter is present, return all categories
    if (all === "true" || all === "") {
      const categories = await service.getAllCategories(locale);
      return NextResponse.json(categories, { 
        status: 200,
        headers: cacheHeaders,
      });
    }

    // If categoryId is provided, return subcategories
    if (categoryId) {
      const subcategories = await service.getSubcategoriesByCategory(categoryId, locale);
      return NextResponse.json(subcategories, { 
        status: 200,
        headers: cacheHeaders,
      });
    }

    // Default: return all categories
    const categories = await service.getAllCategories(locale);
    return NextResponse.json(categories, { 
      status: 200,
      headers: cacheHeaders,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can perform write operations
    const writeGuard = await guardWriteAccess(userId);
    await throwIfNotAllowed(writeGuard);

    const body = await request.json();
    
    // Validate input using domain schema
    const validated = categorySchema.parse(body);

    const service = makeCategoriesService();
    const category = await service.createCategory(validated);
    
    // Invalidate cache
    revalidateTag('categories', 'max');
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 500 }
    );
  }
}


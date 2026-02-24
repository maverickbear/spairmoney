/**
 * Categories Mapper
 * Maps between domain entities and infrastructure DTOs
 */

import { BaseCategory, BaseSubcategory, CategoryWithRelations, SubcategoryWithRelations } from "../../domain/categories/categories.types";
import { CategoryRow, SubcategoryRow } from "@/src/infrastructure/database/repositories/categories.repository";

type Locale = "en" | "pt" | "es";

function resolveLocalizedName(
  row: { name: string; name_pt?: string | null; name_es?: string | null },
  locale?: string
): string {
  if (!locale || locale === "en") return row.name;
  if (locale === "pt" && row.name_pt) return row.name_pt;
  if (locale === "es" && row.name_es) return row.name_es;
  return row.name;
}

export class CategoriesMapper {
  /**
   * Map repository row to domain entity (with optional locale for localized name)
   */
  static categoryToDomain(row: CategoryRow, locale?: string): BaseCategory {
    return {
      id: row.id,
      name: resolveLocalizedName(row, locale),
      type: row.type || "expense",
      householdId: row.household_id ?? null,
      isSystem: row.is_system,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map domain entity to repository row
   */
  static categoryToRepository(domain: Partial<BaseCategory>): Partial<CategoryRow> {
    return {
      id: domain.id,
      name: domain.name,
      type: domain.type ?? null,
      household_id: domain.householdId ?? null,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  /**
   * Map repository row to domain entity with relations (with optional locale for localized name)
   */
  static categoryToDomainWithRelations(row: CategoryRow, locale?: string): CategoryWithRelations {
    return {
      ...this.categoryToDomain(row, locale),
    };
  }

  /**
   * Map repository row to domain entity (with optional locale for localized name)
   */
  static subcategoryToDomain(row: SubcategoryRow, locale?: string): BaseSubcategory {
    return {
      id: row.id,
      name: resolveLocalizedName(row, locale),
      categoryId: row.category_id,
      householdId: row.household_id ?? null,
      isSystem: row.is_system,
      logo: row.logo,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map domain entity to repository row
   */
  static subcategoryToRepository(domain: Partial<BaseSubcategory>): Partial<SubcategoryRow> {
    return {
      id: domain.id,
      name: domain.name,
      category_id: domain.categoryId,
      household_id: domain.householdId ?? null,
      logo: domain.logo ?? null,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    };
  }

  /**
   * Map repository row to domain entity with relations (with optional locale for localized name)
   */
  static subcategoryToDomainWithRelations(
    row: SubcategoryRow,
    category?: CategoryRow | null,
    locale?: string
  ): SubcategoryWithRelations {
    return {
      ...this.subcategoryToDomain(row, locale),
      category: category ? this.categoryToDomain(category, locale) : null,
    };
  }
}


/**
 * Categories Service
 * Business logic for category management
 */

import { CategoriesRepository } from "@/src/infrastructure/database/repositories/categories.repository";
import { ITransactionsRepository } from "@/src/infrastructure/database/repositories/interfaces/transactions.repository.interface";
import { CategoriesMapper } from "./categories.mapper";
import { CategoryFormData, SubcategoryFormData } from "../../domain/categories/categories.validations";
import { BaseCategory, BaseSubcategory, CategoryWithRelations, SubcategoryWithRelations } from "../../domain/categories/categories.types";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";
import { getCurrentTimestamp } from "@/src/infrastructure/utils/timestamp";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { getActiveHouseholdId } from "@/lib/utils/household";
import { logger } from "@/src/infrastructure/utils/logger";
import { makeSubscriptionsService } from "@/src/application/subscriptions/subscriptions.factory";
import { cacheLife, cacheTag } from 'next/cache';

// Helper function to check if user can write
async function canUserWrite(userId: string): Promise<boolean> {
  const service = makeSubscriptionsService();
  return service.canUserWrite(userId);
}
import { AppError } from "../shared/app-error";

// Cached helper functions (must be standalone, not class methods)
// Cache is keyed by householdId and locale so each household/locale gets correct localized names.
async function getAllCategoriesCached(
  householdId?: string | null,
  locale?: string
): Promise<CategoryWithRelations[]> {
  'use cache: private'
  cacheTag('categories', householdId ? `categories-household-${householdId}` : 'categories-global', locale ? `locale-${locale}` : 'locale-en')
  cacheLife('hours')

  const repository = new CategoriesRepository();

  const categoryRows = await repository.findAllCategories(householdId ?? undefined);
  const categoryIds = categoryRows.map(c => c.id);

  const allSubcategoriesRaw = categoryIds.length > 0
    ? await repository.findSubcategoriesByCategoryIds(categoryIds, householdId ?? undefined)
    : [];

  const allSubcategories = allSubcategoriesRaw.map(s => ({ ...s, categoryId: s.category_id }));

  const categories: CategoryWithRelations[] = categoryRows.map(categoryRow => {
    const subcategories = allSubcategories.filter(s => s.categoryId === categoryRow.id);

    return {
      ...CategoriesMapper.categoryToDomainWithRelations(categoryRow, locale),
      subcategories: subcategories.map(s => CategoriesMapper.subcategoryToDomain(s, locale)),
    };
  });

  return categories;
}

async function getSubcategoriesByCategoryCached(
  categoryId: string,
  householdId?: string | null,
  locale?: string
): Promise<SubcategoryWithRelations[]> {
  'use cache: private'
  cacheTag('categories', `category-${categoryId}`, householdId ? `categories-household-${householdId}` : 'categories-global', locale ? `locale-${locale}` : 'locale-en')
  cacheLife('hours')

  const repository = new CategoriesRepository();

  const category = await repository.findCategoryById(categoryId);
  if (!category) {
    return [];
  }

  const subcategoryRows = await repository.findSubcategoriesByCategoryId(categoryId, householdId ?? undefined);

  return subcategoryRows.map(row =>
    CategoriesMapper.subcategoryToDomainWithRelations(row, category, locale)
  );
}

export class CategoriesService {
  constructor(
    private repository: CategoriesRepository,
    private transactionsRepository: ITransactionsRepository
  ) {}

  /**
   * Get all categories with relations (system + current user's active household).
   * @param locale Optional locale (en, pt, es) for localized category/subcategory names from name_pt, name_es columns.
   */
  async getAllCategories(locale?: string): Promise<CategoryWithRelations[]> {
    const userId = await getCurrentUserId();
    const householdId = userId ? await getActiveHouseholdId(userId) : null;
    return getAllCategoriesCached(householdId, locale);
  }

  /**
   * Get subcategories by category (system + current user's active household).
   * @param locale Optional locale (en, pt, es) for localized names from name_pt, name_es columns.
   */
  async getSubcategoriesByCategory(categoryId: string, locale?: string): Promise<SubcategoryWithRelations[]> {
    const userId = await getCurrentUserId();
    const householdId = userId ? await getActiveHouseholdId(userId) : null;
    return getSubcategoriesByCategoryCached(categoryId, householdId, locale);
  }

  /**
   * Get category by ID (returns null if not found).
   * Used by callers that need to resolve or validate a category id before creating subcategories.
   * @param locale Optional locale for localized name.
   */
  async getCategoryById(id: string, locale?: string): Promise<BaseCategory | null> {
    const row = await this.repository.findCategoryById(id);
    return row ? CategoriesMapper.categoryToDomain(row, locale) : null;
  }

  /**
   * Get the first category whose name contains "subscription" (case-insensitive).
   * Used as fallback when the client sends an external/subscription-service category id
   * that does not exist in the categories table.
   */
  async getDefaultSubscriptionCategoryId(): Promise<string | null> {
    const categories = await this.getAllCategories();
    const match = categories.find((c) =>
      (c.name ?? "").toLowerCase().includes("subscription")
    );
    return match?.id ?? null;
  }

  /**
   * Get a category id suitable for subscription subcategories: first one with "subscription"
   * in the name; if none, try to create "Subscription" (when user has permission);
   * otherwise the first expense category. Never returns null if the user has any categories.
   */
  async getOrCreateSubscriptionCategoryId(): Promise<string> {
    let id = await this.getDefaultSubscriptionCategoryId();
    if (id) return id;

    try {
      await this.createCategory({ name: "Subscription", type: "expense" });
      id = await this.getDefaultSubscriptionCategoryId();
      if (id) return id;
    } catch {
      // User may not have permission to create categories; fall back to first expense category
    }

    const categories = await this.getAllCategories();
    const firstExpense = categories.find((c) => c.type === "expense");
    if (firstExpense?.id) return firstExpense.id;

    throw new AppError(
      "No category found. Please add at least one expense category in Settings > Categories.",
      400
    );
  }

  /**
   * Create a new category (scoped to current user's active household).
   */
  async createCategory(data: CategoryFormData): Promise<CategoryWithRelations> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const householdId = await getActiveHouseholdId(userId);
    if (!householdId) {
      throw new AppError("Active household required to create custom categories", 400);
    }

    const isPaidPlan = await canUserWrite(userId);
    if (!isPaidPlan) {
      throw new AppError("Creating custom categories requires a paid plan", 403);
    }

    const existingCategories = await this.repository.findAllCategories(householdId);
    const customCategories = existingCategories.filter((c) => c.household_id === householdId);
    const normalizedName = data.name.trim().toLowerCase();
    const duplicate = customCategories.find(
      (c) => c.name.trim().toLowerCase() === normalizedName && c.type === data.type
    );
    if (duplicate) {
      throw new AppError("A category with this name and type already exists in your household", 409);
    }

    const id = crypto.randomUUID();
    const now = getCurrentTimestamp();

    const categoryRow = await this.repository.createCategory({
      id,
      name: data.name,
      type: data.type,
      householdId,
      createdAt: now,
      updatedAt: now,
    });

    return CategoriesMapper.categoryToDomainWithRelations(categoryRow);
  }

  /**
   * Update a category (must belong to current user's household or legacy user).
   */
  async updateCategory(id: string, data: Partial<CategoryFormData>): Promise<CategoryWithRelations> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const householdId = await getActiveHouseholdId(userId);
    const existingCategory = await this.repository.findCategoryById(id);
    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }

    const canEdit = existingCategory.household_id != null && existingCategory.household_id === householdId;
    if (!canEdit) {
      throw new AppError("Cannot update system default categories", 403);
    }

    if (data.name !== undefined || data.type !== undefined) {
      const existingCategories = await this.repository.findAllCategories(householdId);
      const customCategories = existingCategories.filter((c) => c.household_id === householdId);
      const newName = (data.name ?? existingCategory.name ?? "").trim().toLowerCase();
      const newType = data.type ?? existingCategory.type;
      const duplicate = customCategories.find(
        (c) =>
          c.id !== id &&
          c.name.trim().toLowerCase() === newName &&
          (c.type ?? null) === (newType ?? null)
      );
      if (duplicate) {
        throw new AppError("A category with this name and type already exists in your household", 409);
      }
    }

    const updateData: any = {
      updatedAt: getCurrentTimestamp(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    const categoryRow = await this.repository.updateCategory(id, updateData);

    return CategoriesMapper.categoryToDomainWithRelations(categoryRow);
  }

  /**
   * Delete a category (must belong to current user's household or legacy user).
   */
  async deleteCategory(id: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const householdId = await getActiveHouseholdId(userId);
    const category = await this.repository.findCategoryById(id);
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    const canDelete = category.household_id != null && category.household_id === householdId;
    if (!canDelete) {
      throw new AppError("Cannot delete system default categories", 403);
    }

    const linkedCount = await this.transactionsRepository.count({ categoryId: id });
    if (linkedCount > 0) {
      throw new AppError(
        "Cannot delete this category because it has linked transactions. Change the category of those transactions first.",
        409
      );
    }

    await this.repository.deleteCategory(id);
  }

  /**
   * Create a new subcategory (category must be system or current user's household).
   */
  async createSubcategory(data: SubcategoryFormData): Promise<SubcategoryWithRelations> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const householdId = await getActiveHouseholdId(userId);
    const category = await this.repository.findCategoryById(data.categoryId);
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    if (category.is_system === true) {
      const isPaidPlan = await canUserWrite(userId);
      if (!isPaidPlan) {
        throw new AppError("Creating subcategories for system default categories requires a paid plan", 403);
      }
    } else {
      const canUseCategory = category.household_id != null && category.household_id === householdId;
      if (!canUseCategory) {
        throw new AppError("Category not found or access denied", 404);
      }
    }

    const id = crypto.randomUUID();
    const now = getCurrentTimestamp();
    const subcategoryHouseholdId = category.is_system === true ? null : category.household_id;

    const subcategoryRow = await this.repository.createSubcategory({
      id,
      name: data.name,
      categoryId: data.categoryId,
      householdId: subcategoryHouseholdId,
      logo: data.logo || null,
      createdAt: now,
      updatedAt: now,
    });

    return CategoriesMapper.subcategoryToDomainWithRelations(subcategoryRow, category);
  }

  /**
   * Update a subcategory (must belong to current user's household or legacy user).
   */
  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>): Promise<SubcategoryWithRelations> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const householdId = await getActiveHouseholdId(userId);
    const subcategory = await this.repository.findSubcategoryById(id);
    if (!subcategory) {
      throw new AppError("Subcategory not found", 404);
    }

    const category = await this.repository.findCategoryById(subcategory.category_id);
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    const canEdit =
      (subcategory.household_id != null && subcategory.household_id === householdId) ||
      (category.household_id != null && category.household_id === householdId);
    if (!canEdit) {
      throw new AppError("Cannot update this subcategory", 403);
    }

    const updateData: any = {
      updatedAt: getCurrentTimestamp(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.logo !== undefined) {
      updateData.logo = data.logo || null;
    }

    const subcategoryRow = await this.repository.updateSubcategory(id, updateData);


    return CategoriesMapper.subcategoryToDomainWithRelations(subcategoryRow, category);
  }

  /**
   * Delete a subcategory (must belong to current user's household or legacy user).
   */
  async deleteSubcategory(id: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const householdId = await getActiveHouseholdId(userId);
    const subcategory = await this.repository.findSubcategoryById(id);
    if (!subcategory) {
      throw new AppError("Subcategory not found", 404);
    }

    const category = await this.repository.findCategoryById(subcategory.category_id);
    if (!category) {
      throw new AppError("Category not found", 404);
    }

    const canDelete =
      (subcategory.household_id != null && subcategory.household_id === householdId) ||
      (category.household_id != null && category.household_id === householdId);
    if (!canDelete) {
      throw new AppError("Cannot delete this subcategory", 403);
    }

    const linkedCount = await this.transactionsRepository.count({ subcategoryId: id });
    if (linkedCount > 0) {
      throw new AppError(
        "Cannot delete this subcategory because it has linked transactions. Change the category of those transactions first.",
        409
      );
    }

    await this.repository.deleteSubcategory(id);
  }

}


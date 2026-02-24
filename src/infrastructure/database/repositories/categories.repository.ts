/**
 * Categories Repository
 * Data access layer for categories - only handles database operations
 * No business logic here
 */

import { createServerClient } from "../supabase-server";
import { BaseCategory, BaseSubcategory } from "../../../domain/categories/categories.types";
import { logger } from "@/lib/utils/logger";
import { ICategoriesRepository } from "./interfaces/categories.repository.interface";

export interface CategoryRow {
  id: string;
  name: string;
  name_pt?: string | null;
  name_es?: string | null;
  type: "income" | "expense" | "transfer" | null;
  household_id: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubcategoryRow {
  id: string;
  name: string;
  name_pt?: string | null;
  name_es?: string | null;
  category_id: string;
  household_id: string | null;
  is_system: boolean;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

export class CategoriesRepository implements ICategoriesRepository {
  /**
   * Find all categories: system + household's custom (or legacy user's when householdId is null).
   */
  async findAllCategories(
    householdId?: string | null,
    accessToken?: string,
    refreshToken?: string
  ): Promise<CategoryRow[]> {
    const supabase = await createServerClient(accessToken, refreshToken);

    let query = supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (householdId) {
      query = query.or(`is_system.eq.true,household_id.eq.${householdId}`);
    } else {
      query = query.eq("is_system", true);
    }

    const { data: categories, error } = await query;

    if (error) {
      logger.error("[CategoriesRepository] Error fetching categories:", error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return (categories || []) as CategoryRow[];
  }

  /**
   * Find category by ID
   */
  async findCategoryById(
    id: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<CategoryRow | null> {
    const supabase = await createServerClient(accessToken, refreshToken);

    const { data: category, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error("[CategoriesRepository] Error fetching category:", error);
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return category as CategoryRow;
  }

  /**
   * Find multiple categories by IDs (system + household or legacy user).
   */
  async findCategoriesByIds(
    ids: string[],
    householdId?: string | null,
    accessToken?: string,
    refreshToken?: string
  ): Promise<CategoryRow[]> {
    if (ids.length === 0) {
      return [];
    }

    const supabase = await createServerClient(accessToken, refreshToken);

    let query = supabase
      .from("categories")
      .select("id, name, type, household_id, is_system, created_at, updated_at")
      .in("id", ids);

    if (householdId) {
      query = query.or(`is_system.eq.true,household_id.eq.${householdId}`);
    } else {
      query = query.eq("is_system", true);
    }

    const { data: categories, error } = await query;

    if (error) {
      logger.error("[CategoriesRepository] Error fetching categories by IDs:", error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return (categories || []) as CategoryRow[];
  }

  /**
   * Create a new category
   */
  async createCategory(data: {
    id: string;
    name: string;
    type: "income" | "expense" | "transfer";
    householdId: string | null;
    createdAt: string;
    updatedAt: string;
  }): Promise<CategoryRow> {
    const supabase = await createServerClient();

    const isSystem = data.householdId === null;

    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        id: data.id,
        name: data.name,
        type: data.type,
        household_id: data.householdId,
        is_system: isSystem,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
      .select()
      .single();

    if (error) {
      logger.error("[CategoriesRepository] Error creating category:", error);
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return category as CategoryRow;
  }

  /**
   * Update a category
   */
  async updateCategory(
    id: string,
    data: Partial<{
      name: string;
      type: "income" | "expense" | "transfer";
      updatedAt: string;
    }>
  ): Promise<CategoryRow> {
    const supabase = await createServerClient();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.updatedAt !== undefined) updateData.updated_at = data.updatedAt;

    const { data: category, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("[CategoriesRepository] Error updating category:", error);
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return category as CategoryRow;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("[CategoriesRepository] Error deleting category:", error);
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  /**
   * Find all subcategories for a category (system + household or legacy user).
   */
  async findSubcategoriesByCategoryId(
    categoryId: string,
    householdId?: string | null,
    accessToken?: string,
    refreshToken?: string
  ): Promise<SubcategoryRow[]> {
    const supabase = await createServerClient(accessToken, refreshToken);

    let query = supabase
      .from("subcategories")
      .select("*")
      .eq("category_id", categoryId)
      .order("name", { ascending: true });

    if (householdId) {
      query = query.or(`is_system.eq.true,household_id.eq.${householdId}`);
    } else {
      query = query.eq("is_system", true);
    }

    const { data: subcategories, error } = await query;

    if (error) {
      logger.error("[CategoriesRepository] Error fetching subcategories:", error);
      throw new Error(`Failed to fetch subcategories: ${error.message}`);
    }

    return (subcategories || []) as SubcategoryRow[];
  }

  /**
   * Find all subcategories for multiple categories (system + household or legacy user).
   */
  async findSubcategoriesByCategoryIds(
    categoryIds: string[],
    householdId?: string | null,
    accessToken?: string,
    refreshToken?: string
  ): Promise<SubcategoryRow[]> {
    if (categoryIds.length === 0) {
      return [];
    }

    const supabase = await createServerClient(accessToken, refreshToken);

    let query = supabase
      .from("subcategories")
      .select("*")
      .in("category_id", categoryIds)
      .order("category_id", { ascending: true })
      .order("name", { ascending: true });

    if (householdId) {
      query = query.or(`is_system.eq.true,household_id.eq.${householdId}`);
    } else {
      query = query.eq("is_system", true);
    }

    const { data: subcategories, error } = await query;

    if (error) {
      logger.error("[CategoriesRepository] Error fetching subcategories by category IDs:", error);
      throw new Error(`Failed to fetch subcategories: ${error.message}`);
    }

    return (subcategories || []) as SubcategoryRow[];
  }

  /**
   * Find subcategory by ID
   */
  async findSubcategoryById(
    id: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<SubcategoryRow | null> {
    const supabase = await createServerClient(accessToken, refreshToken);

    const { data: subcategory, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error("[CategoriesRepository] Error fetching subcategory:", error);
      throw new Error(`Failed to fetch subcategory: ${error.message}`);
    }

    return subcategory as SubcategoryRow;
  }

  /**
   * Find multiple subcategories by IDs (system + household or legacy user).
   */
  async findSubcategoriesByIds(
    ids: string[],
    householdId?: string | null,
    accessToken?: string,
    refreshToken?: string
  ): Promise<SubcategoryRow[]> {
    if (ids.length === 0) {
      return [];
    }

    const supabase = await createServerClient(accessToken, refreshToken);

    let query = supabase
      .from("subcategories")
      .select("id, name, logo, category_id, household_id, is_system, created_at, updated_at")
      .in("id", ids);

    if (householdId) {
      query = query.or(`is_system.eq.true,household_id.eq.${householdId}`);
    } else {
      query = query.eq("is_system", true);
    }

    const { data: subcategories, error } = await query;

    if (error) {
      logger.error("[CategoriesRepository] Error fetching subcategories by IDs:", error);
      throw new Error(`Failed to fetch subcategories: ${error.message}`);
    }

    return (subcategories || []) as SubcategoryRow[];
  }

  /**
   * Create a new subcategory
   */
  async createSubcategory(data: {
    id: string;
    name: string;
    categoryId: string;
    householdId: string | null;
    logo: string | null;
    createdAt: string;
    updatedAt: string;
  }): Promise<SubcategoryRow> {
    const supabase = await createServerClient();

    const isSystem = data.householdId === null;

    const { data: subcategory, error } = await supabase
      .from("subcategories")
      .insert({
        id: data.id,
        name: data.name,
        category_id: data.categoryId,
        household_id: data.householdId,
        is_system: isSystem,
        logo: data.logo,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
      .select()
      .single();

    if (error) {
      logger.error("[CategoriesRepository] Error creating subcategory:", error);
      throw new Error(`Failed to create subcategory: ${error.message}`);
    }

    return subcategory as SubcategoryRow;
  }

  /**
   * Update a subcategory
   */
  async updateSubcategory(
    id: string,
    data: Partial<{
      name: string;
      categoryId: string;
      logo: string | null;
      updatedAt: string;
    }>
  ): Promise<SubcategoryRow> {
    const supabase = await createServerClient();

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.updatedAt !== undefined) updateData.updated_at = data.updatedAt;

    const { data: subcategory, error } = await supabase
      .from("subcategories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("[CategoriesRepository] Error updating subcategory:", error);
      throw new Error(`Failed to update subcategory: ${error.message}`);
    }

    return subcategory as SubcategoryRow;
  }

  /**
   * Delete a subcategory
   */
  async deleteSubcategory(id: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("subcategories")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("[CategoriesRepository] Error deleting subcategory:", error);
      throw new Error(`Failed to delete subcategory: ${error.message}`);
    }
  }

}


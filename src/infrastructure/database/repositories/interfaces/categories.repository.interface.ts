/**
 * Categories Repository Interface
 * Contract for category data access
 */

import { CategoryRow, SubcategoryRow } from "../categories.repository";

export interface ICategoriesRepository {
  findCategoriesByIds(
    ids: string[],
    householdId?: string | null,
    accessToken?: string,
    refreshToken?: string
  ): Promise<CategoryRow[]>;
  findCategoryById(
    id: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<CategoryRow | null>;
  findSubcategoriesByIds(
    ids: string[],
    householdId?: string | null,
    accessToken?: string,
    refreshToken?: string
  ): Promise<SubcategoryRow[]>;
  findSubcategoryById(
    id: string,
    accessToken?: string,
    refreshToken?: string
  ): Promise<SubcategoryRow | null>;
  createCategory(data: {
    id: string;
    name: string;
    type: "income" | "expense" | "transfer";
    householdId: string | null;
    createdAt: string;
    updatedAt: string;
  }): Promise<CategoryRow>;
  createSubcategory(data: {
    id: string;
    name: string;
    categoryId: string;
    logo: string | null;
    householdId: string | null;
    createdAt: string;
    updatedAt: string;
  }): Promise<SubcategoryRow>;
}


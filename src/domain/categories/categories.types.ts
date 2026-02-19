/**
 * Domain types for categories
 * Pure TypeScript types with no external dependencies
 */

export interface BaseCategory {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  householdId?: string | null;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BaseSubcategory {
  id: string;
  name: string;
  categoryId: string;
  householdId?: string | null;
  isSystem?: boolean;
  logo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryWithRelations extends BaseCategory {
  subcategories?: Array<{ id: string; name: string; logo?: string | null }>;
}

export interface SubcategoryWithRelations extends BaseSubcategory {
  category?: BaseCategory | null;
}

// Alias for backward compatibility (matches client-side Category interface)
export interface Category extends BaseCategory {
  subcategories?: Array<{ id: string; name: string; logo?: string | null }>;
}


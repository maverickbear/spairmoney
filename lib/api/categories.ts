"use server";

import { createServerClient } from "@/lib/supabase-server";
import { getCurrentTimestamp } from "@/lib/utils/timestamp";

export async function getMacros() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("Macro")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}

export async function getCategoriesByMacro(macroId: string) {
  const supabase = createServerClient();

  const { data: categories, error } = await supabase
    .from("Category")
    .select(`
      *,
      subcategories:Subcategory(*)
    `)
    .eq("macroId", macroId)
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return categories || [];
}

export async function getSubcategoriesByCategory(categoryId: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("Subcategory")
    .select("*")
    .eq("categoryId", categoryId)
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}

export async function getAllCategories() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("Category")
    .select(`
      *,
      macro:Macro(*),
      subcategories:Subcategory(*)
    `)
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return data || [];
}

export async function createCategory(data: { name: string; macroId: string }) {
  const supabase = createServerClient();

  const id = crypto.randomUUID();
  const now = getCurrentTimestamp();

  const { data: category, error } = await supabase
    .from("Category")
    .insert({
      id,
      name: data.name,
      macroId: data.macroId,
      createdAt: now,
      updatedAt: now,
    })
    .select(`
      *,
      macro:Macro(*),
      subcategories:Subcategory(*)
    `)
    .single();

  if (error) {
    console.error("Supabase error creating category:", error);
    throw new Error(`Failed to create category: ${error.message || JSON.stringify(error)}`);
  }

  return category;
}

export async function updateCategory(id: string, data: { name?: string; macroId?: string }) {
  const supabase = createServerClient();

  const updateData: Record<string, unknown> = {
    updatedAt: getCurrentTimestamp(),
  };
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  
  if (data.macroId !== undefined) {
    updateData.macroId = data.macroId;
  }

  const { data: category, error } = await supabase
    .from("Category")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      macro:Macro(*),
      subcategories:Subcategory(*)
    `)
    .single();

  if (error) {
    console.error("Supabase error updating category:", error);
    throw new Error(`Failed to update category: ${error.message || JSON.stringify(error)}`);
  }

  return category;
}

export async function createSubcategory(data: { name: string; categoryId: string }) {
  const supabase = createServerClient();

  const id = crypto.randomUUID();
  const now = getCurrentTimestamp();

  const { data: subcategory, error } = await supabase
    .from("Subcategory")
    .insert({
      id,
      name: data.name,
      categoryId: data.categoryId,
      createdAt: now,
      updatedAt: now,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Supabase error creating subcategory:", error);
    throw new Error(`Failed to create subcategory: ${error.message || JSON.stringify(error)}`);
  }

  return subcategory;
}

export async function updateSubcategory(id: string, data: { name?: string }) {
  const supabase = createServerClient();

  const updateData: Record<string, unknown> = {
    updatedAt: getCurrentTimestamp(),
  };
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  const { data: subcategory, error } = await supabase
    .from("Subcategory")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Supabase error updating subcategory:", error);
    throw new Error(`Failed to update subcategory: ${error.message || JSON.stringify(error)}`);
  }

  return subcategory;
}

export async function deleteSubcategory(id: string) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("Subcategory")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase error deleting subcategory:", error);
    throw new Error(`Failed to delete subcategory: ${error.message || JSON.stringify(error)}`);
  }

  return true;
}

export async function deleteCategory(id: string) {
  const supabase = createServerClient();

  // First delete all subcategories associated with this category
  const { error: subcategoryError } = await supabase
    .from("Subcategory")
    .delete()
    .eq("categoryId", id);

  if (subcategoryError) {
    console.error("Supabase error deleting subcategories:", subcategoryError);
    throw new Error(`Failed to delete subcategories: ${subcategoryError.message || JSON.stringify(subcategoryError)}`);
  }

  // Then delete the category itself
  const { error } = await supabase
    .from("Category")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase error deleting category:", error);
    throw new Error(`Failed to delete category: ${error.message || JSON.stringify(error)}`);
  }

  return true;
}

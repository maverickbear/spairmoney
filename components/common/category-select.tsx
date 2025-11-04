"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMacros, getCategoriesByMacro, getSubcategoriesByCategory } from "@/lib/api/categories";

interface Category {
  id: string;
  name: string;
  macroId: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface Macro {
  id: string;
  name: string;
}

interface CategorySelectProps {
  macroId?: string;
  categoryId?: string;
  subcategoryId?: string;
  onMacroChange?: (macroId: string) => void;
  onCategoryChange?: (categoryId: string) => void;
  onSubcategoryChange?: (subcategoryId: string) => void;
  includeSubcategory?: boolean;
}

export function CategorySelect({
  macroId,
  categoryId,
  subcategoryId,
  onMacroChange,
  onCategoryChange,
  onSubcategoryChange,
  includeSubcategory = true,
}: CategorySelectProps) {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedMacroId, setSelectedMacroId] = useState<string>(macroId || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categoryId || "");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>(subcategoryId || "");

  useEffect(() => {
    getMacros().then(setMacros);
  }, []);

  useEffect(() => {
    if (selectedMacroId) {
      getCategoriesByMacro(selectedMacroId).then(setCategories);
      setSubcategories([]);
      setSelectedCategoryId("");
      setSelectedSubcategoryId("");
      onCategoryChange?.("");
      onSubcategoryChange?.("");
    }
  }, [selectedMacroId, onCategoryChange, onSubcategoryChange]);

  useEffect(() => {
    if (selectedCategoryId) {
      getSubcategoriesByCategory(selectedCategoryId).then(setSubcategories);
      setSelectedSubcategoryId("");
      onSubcategoryChange?.("");
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId, onSubcategoryChange]);

  const handleMacroChange = (value: string) => {
    setSelectedMacroId(value);
    onMacroChange?.(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    onCategoryChange?.(value);
  };

  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategoryId(value);
    onSubcategoryChange?.(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Group</label>
        <Select value={selectedMacroId} onValueChange={handleMacroChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent>
            {macros.map((macro) => (
              <SelectItem key={macro.id} value={macro.id}>
                {macro.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Category</label>
        <Select
          value={selectedCategoryId}
          onValueChange={handleCategoryChange}
          disabled={!selectedMacroId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {includeSubcategory && (
        <div>
          <label className="text-sm font-medium mb-2 block">Subcategory</label>
          <Select
            value={selectedSubcategoryId}
            onValueChange={handleSubcategoryChange}
            disabled={!selectedCategoryId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((subcategory) => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

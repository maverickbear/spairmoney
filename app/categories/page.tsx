"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { CategoryDialog } from "@/components/categories/category-dialog";

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  macroId: string;
  macro?: {
    id: string;
    name: string;
  };
  subcategories?: Subcategory[];
}

interface Macro {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [categoriesRes, macrosRes] = await Promise.all([
        fetch("/api/categories/all"),
        fetch("/api/categories"),
      ]);
      const [allCategories, macrosData] = await Promise.all([
        categoriesRes.json(),
        macrosRes.json(),
      ]);
      
      setCategories(allCategories);
      setMacros(macrosData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this category? This will also delete all associated subcategories.")) return;

    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Categories</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your categories and subcategories</p>
        </div>
        <Button size="sm" onClick={() => {
          setSelectedCategory(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs md:text-sm">Group</TableHead>
              <TableHead className="text-xs md:text-sm">Category</TableHead>
              <TableHead className="text-xs md:text-sm hidden md:table-cell">Subcategories</TableHead>
              <TableHead className="text-xs md:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="text-xs md:text-sm">{category.macro?.name}</TableCell>
                <TableCell className="text-xs md:text-sm font-medium">{category.name}</TableCell>
                <TableCell className="text-xs md:text-sm hidden md:table-cell">
                  {category.subcategories?.map((s) => s.name).join(", ") || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1 md:space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-10 md:w-10"
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-10 md:w-10"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={selectedCategory}
        macros={macros}
        onSuccess={loadData}
      />
    </div>
  );
}


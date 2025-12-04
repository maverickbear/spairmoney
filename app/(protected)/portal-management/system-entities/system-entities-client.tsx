"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnifiedEntitiesTable } from "@/components/admin/unified-entities-table";
import { GroupDialog } from "@/components/admin/group-dialog";
import { CategoryDialog } from "@/components/admin/category-dialog";
import { SubcategoryDialog } from "@/components/admin/subcategory-dialog";
import { BulkImportDialog } from "@/components/admin/bulk-import-dialog";
import { Plus, Upload, ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SystemGroup, SystemCategory, SystemSubcategory } from "@/src/domain/admin/admin.types";

interface SystemEntitiesPageClientProps {
  initialGroups: SystemGroup[];
  initialCategories: SystemCategory[];
  initialSubcategories: SystemSubcategory[];
}

export function SystemEntitiesPageClient({
  initialGroups,
  initialCategories,
  initialSubcategories,
}: SystemEntitiesPageClientProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<SystemGroup[]>(initialGroups);
  const [categories, setCategories] = useState<SystemCategory[]>(initialCategories);
  const [subcategories, setSubcategories] = useState<SystemSubcategory[]>(initialSubcategories);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SystemGroup | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SystemCategory | null>(null);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<SystemSubcategory | null>(null);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);

  function handleCreateGroup() {
    setEditingGroup(null);
    setIsGroupDialogOpen(true);
  }

  function handleEditGroup(group: SystemGroup) {
    setEditingGroup(group);
    setIsGroupDialogOpen(true);
  }

  async function handleDeleteGroup(id: string) {
    const response = await fetch(`/api/admin/groups?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete group");
    }

    router.refresh();
  }

  function handleCreateCategory() {
    setEditingCategory(null);
    setIsCategoryDialogOpen(true);
  }

  function handleEditCategory(category: SystemCategory) {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  }

  async function handleDeleteCategory(id: string) {
    const response = await fetch(`/api/admin/categories?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete category");
    }

    router.refresh();
  }

  function handleCreateSubcategory() {
    setEditingSubcategory(null);
    setIsSubcategoryDialogOpen(true);
  }

  function handleEditSubcategory(subcategory: SystemSubcategory) {
    setEditingSubcategory(subcategory);
    setIsSubcategoryDialogOpen(true);
  }

  async function handleDeleteSubcategory(id: string) {
    const response = await fetch(`/api/admin/subcategories?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete subcategory");
    }

    router.refresh();
  }

  async function handleBulkDelete(items: Array<{ id: string; type: "group" | "category" | "subcategory" }>) {
    // Delete all items in parallel, tracking which item each promise corresponds to
    const deletePromises = items.map(async (item) => {
      let endpoint = "";
      switch (item.type) {
        case "group":
          endpoint = `/api/admin/groups?id=${item.id}`;
          break;
        case "category":
          endpoint = `/api/admin/categories?id=${item.id}`;
          break;
        case "subcategory":
          endpoint = `/api/admin/subcategories?id=${item.id}`;
          break;
      }

      const response = await fetch(endpoint, { method: "DELETE" });
      return { response, item };
    });

    const results = await Promise.all(deletePromises);
    const errors: string[] = [];

    results.forEach(({ response, item }) => {
      if (!response.ok) {
        errors.push(`Failed to delete ${item.type} "${item.id}"`);
      }
    });

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }

    router.refresh();
  }

  function handleSuccess() {
    router.refresh();
  }

  // Filter system entities based on search term
  const filteredEntities = useMemo(() => {
    if (!searchTerm.trim()) {
      return { groups, categories, subcategories };
    }

    const searchLower = searchTerm.toLowerCase().trim();

    // Find matching subcategories
    const matchingSubcategoryIds = new Set<string>();
    const matchingCategoryIds = new Set<string>();
    const matchingGroupIds = new Set<string>();

    subcategories.forEach((subcategory) => {
      if (subcategory.name.toLowerCase().includes(searchLower)) {
        matchingSubcategoryIds.add(subcategory.id);
        matchingCategoryIds.add(subcategory.categoryId);
      }
    });

    // Find matching categories
    categories.forEach((category) => {
      if (category.name.toLowerCase().includes(searchLower)) {
        matchingCategoryIds.add(category.id);
        matchingGroupIds.add(category.macroId);
      }
    });

    // Find matching groups
    groups.forEach((group) => {
      if (group.name.toLowerCase().includes(searchLower)) {
        matchingGroupIds.add(group.id);
      }
    });

    // If a category matches, include its group
    categories.forEach((category) => {
      if (matchingCategoryIds.has(category.id)) {
        matchingGroupIds.add(category.macroId);
      }
    });

    // Filter groups
    const filteredGroups = groups.filter((group) => matchingGroupIds.has(group.id));

    // Filter categories (include if group matches or category matches)
    const filteredCategories = categories.filter(
      (category) => matchingGroupIds.has(category.macroId) || matchingCategoryIds.has(category.id)
    );

    // Filter subcategories (include if category matches or subcategory matches)
    const filteredSubcategories = subcategories.filter(
      (subcategory) => matchingCategoryIds.has(subcategory.categoryId) || matchingSubcategoryIds.has(subcategory.id)
    );

    return {
      groups: filteredGroups,
      categories: filteredCategories,
      subcategories: filteredSubcategories,
    };
  }, [searchTerm, groups, categories, subcategories]);

  return (
    <div className="w-full p-4 lg:p-8">
      <div className="space-y-2 pb-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">System Entities</h2>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsBulkImportDialogOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Create</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCreateGroup}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCreateCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCreateSubcategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Subcategory
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search groups, categories, or subcategories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <UnifiedEntitiesTable
          groups={filteredEntities.groups}
          categories={filteredEntities.categories}
          subcategories={filteredEntities.subcategories}
          loading={false}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onEditSubcategory={handleEditSubcategory}
          onDeleteSubcategory={handleDeleteSubcategory}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <GroupDialog
        open={isGroupDialogOpen}
        onOpenChange={(open) => {
          setIsGroupDialogOpen(open);
          if (!open) {
            setEditingGroup(null);
          }
        }}
        group={editingGroup}
        onSuccess={handleSuccess}
      />

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={(open) => {
          setIsCategoryDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
          }
        }}
        category={editingCategory}
        availableMacros={groups.map((g) => ({ id: g.id, name: g.name }))}
        onSuccess={handleSuccess}
      />

      <SubcategoryDialog
        open={isSubcategoryDialogOpen}
        onOpenChange={(open) => {
          setIsSubcategoryDialogOpen(open);
          if (!open) {
            setEditingSubcategory(null);
          }
        }}
        subcategory={editingSubcategory}
        availableCategories={categories.map((c) => ({ 
          id: c.id, 
          name: c.name,
          group: c.group ? { id: c.group.id, name: c.group.name } : null
        }))}
        onSuccess={handleSuccess}
      />

      <BulkImportDialog
        open={isBulkImportDialogOpen}
        onOpenChange={setIsBulkImportDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}


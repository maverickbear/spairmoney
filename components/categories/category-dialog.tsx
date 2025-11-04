"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, CategoryFormData, subcategorySchema, SubcategoryFormData } from "@/lib/validations/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Check } from "lucide-react";

interface Macro {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface PendingSubcategory {
  name: string;
  tempId: string;
}

interface Category {
  id: string;
  name: string;
  macroId: string;
  subcategories?: Subcategory[];
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  macros: Macro[];
  onSuccess?: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  macros,
  onSuccess,
}: CategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>(category?.subcategories || []);
  const [pendingSubcategories, setPendingSubcategories] = useState<PendingSubcategory[]>([]);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [editingPendingSubcategoryTempId, setEditingPendingSubcategoryTempId] = useState<string | null>(null);
  const [editingSubcategoryName, setEditingSubcategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [isSubmittingSubcategory, setIsSubmittingSubcategory] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(category?.id || null);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          macroId: category.macroId,
        }
      : {
          name: "",
          macroId: "",
        },
  });

  // Reset form and subcategories when dialog opens/closes or category changes
  useEffect(() => {
    if (open) {
      form.reset(
        category
          ? {
              name: category.name,
              macroId: category.macroId,
            }
          : {
              name: "",
              macroId: "",
            }
      );
      setSubcategories(category?.subcategories || []);
      setPendingSubcategories([]);
      setCurrentCategoryId(category?.id || null);
      setEditingSubcategoryId(null);
      setEditingPendingSubcategoryTempId(null);
      setEditingSubcategoryName("");
      setNewSubcategoryName("");
      setIsAddingSubcategory(false);
    }
  }, [open, category, form]);

  async function onSubmit(data: CategoryFormData) {
    try {
      setIsSubmitting(true);
      const url = category ? `/api/categories/${category.id}` : "/api/categories";
      const method = category ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save category");
      }

      const savedCategory = await res.json();
      setCurrentCategoryId(savedCategory.id);
      
      // If this is a new category with pending subcategories, create them all
      if (!category && pendingSubcategories.length > 0) {
        try {
          const subcategoryPromises = pendingSubcategories.map((pending) =>
            fetch(`/api/categories/${savedCategory.id}/subcategories`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: pending.name }),
            }).then((res) => {
              if (!res.ok) {
                throw new Error(`Failed to create subcategory: ${pending.name}`);
              }
              return res.json();
            })
          );

          const createdSubcategories = await Promise.all(subcategoryPromises);
          setSubcategories(createdSubcategories);
          setPendingSubcategories([]);
        } catch (error) {
          console.error("Error creating subcategories:", error);
          alert("Category created but some subcategories failed to create. Please add them manually.");
        }
      } else {
        setSubcategories(savedCategory.subcategories || []);
      }

      // Only close dialog and reload if editing existing category
      if (category) {
        onSuccess?.();
        onOpenChange(false);
        form.reset();
      }
      // For new categories, keep dialog open to allow adding more subcategories
    } catch (error) {
      console.error("Error saving category:", error);
      alert(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddSubcategory() {
    const name = newSubcategoryName.trim();
    
    if (!name) {
      alert("Subcategory name is required");
      return;
    }

    // If category already exists, create subcategory immediately
    if (currentCategoryId) {
      try {
        setIsSubmittingSubcategory(true);
        const res = await fetch(`/api/categories/${currentCategoryId}/subcategories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to create subcategory");
        }

        const newSubcategory = await res.json();
        setSubcategories([...subcategories, newSubcategory]);
        setNewSubcategoryName("");
        setIsAddingSubcategory(false);
      } catch (error) {
        console.error("Error creating subcategory:", error);
        alert(error instanceof Error ? error.message : "Failed to create subcategory");
      } finally {
        setIsSubmittingSubcategory(false);
      }
    } else {
      // If category doesn't exist yet, add to pending list
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setPendingSubcategories([...pendingSubcategories, { name, tempId }]);
      setNewSubcategoryName("");
      setIsAddingSubcategory(false);
    }
  }

  async function handleUpdateSubcategory(subcategoryId: string) {
    const name = editingSubcategoryName.trim();
    
    if (!name) {
      alert("Subcategory name is required");
      return;
    }

    try {
      setIsSubmittingSubcategory(true);
      const res = await fetch(`/api/categories/subcategories/${subcategoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update subcategory");
      }

      const updatedSubcategory = await res.json();
      setSubcategories(
        subcategories.map((s) => (s.id === subcategoryId ? updatedSubcategory : s))
      );
      setEditingSubcategoryId(null);
      setEditingSubcategoryName("");
    } catch (error) {
      console.error("Error updating subcategory:", error);
      alert(error instanceof Error ? error.message : "Failed to update subcategory");
    } finally {
      setIsSubmittingSubcategory(false);
    }
  }

  function handleUpdatePendingSubcategory(tempId: string) {
    const name = editingSubcategoryName.trim();
    
    if (!name) {
      alert("Subcategory name is required");
      return;
    }

    setPendingSubcategories(
      pendingSubcategories.map((p) => (p.tempId === tempId ? { ...p, name } : p))
    );
    setEditingPendingSubcategoryTempId(null);
    setEditingSubcategoryName("");
  }

  function handleDeletePendingSubcategory(tempId: string) {
    setPendingSubcategories(pendingSubcategories.filter((p) => p.tempId !== tempId));
  }

  async function handleDeleteSubcategory(subcategoryId: string) {
    if (!confirm("Are you sure you want to delete this subcategory?")) {
      return;
    }

    try {
      setIsSubmittingSubcategory(true);
      const res = await fetch(`/api/categories/subcategories/${subcategoryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete subcategory");
      }

      setSubcategories(subcategories.filter((s) => s.id !== subcategoryId));
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      alert(error instanceof Error ? error.message : "Failed to delete subcategory");
    } finally {
      setIsSubmittingSubcategory(false);
    }
  }

  function startEditingSubcategory(subcategory: Subcategory) {
    setEditingSubcategoryId(subcategory.id);
    setEditingPendingSubcategoryTempId(null);
    setEditingSubcategoryName(subcategory.name);
  }

  function startEditingPendingSubcategory(pending: PendingSubcategory) {
    setEditingPendingSubcategoryTempId(pending.tempId);
    setEditingSubcategoryId(null);
    setEditingSubcategoryName(pending.name);
  }

  function cancelEditingSubcategory() {
    setEditingSubcategoryId(null);
    setEditingPendingSubcategoryTempId(null);
    setEditingSubcategoryName("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? "Edit" : "Add"} Category</DialogTitle>
          <DialogDescription>
            {category
              ? "Update the category details below."
              : "Create a new category by selecting a group and entering a name."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Group</label>
            <Select
              value={form.watch("macroId")}
              onValueChange={(value) => form.setValue("macroId", value)}
            >
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
            {form.formState.errors.macroId && (
              <p className="text-sm text-red-500">
                {form.formState.errors.macroId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category Name</label>
            <Input
              {...form.register("name")}
              placeholder="Enter category name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Subcategories</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingSubcategory(true)}
                disabled={isAddingSubcategory || isSubmittingSubcategory}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            
            {isAddingSubcategory && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter subcategory name"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubcategory();
                    } else if (e.key === "Escape") {
                      setIsAddingSubcategory(false);
                      setNewSubcategoryName("");
                    }
                  }}
                  autoFocus
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleAddSubcategory}
                  disabled={isSubmittingSubcategory || !newSubcategoryName.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingSubcategory(false);
                    setNewSubcategoryName("");
                  }}
                  disabled={isSubmittingSubcategory}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="space-y-1 max-h-48 overflow-y-auto rounded-md border p-2">
              {subcategories.length === 0 && pendingSubcategories.length === 0 && !isAddingSubcategory ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No subcategories yet
                </p>
              ) : (
                <>
                  {/* Show pending subcategories (before category is created) */}
                  {pendingSubcategories.map((pending) => (
                    <div
                      key={pending.tempId}
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded"
                    >
                      {editingPendingSubcategoryTempId === pending.tempId ? (
                        <>
                          <Input
                            value={editingSubcategoryName}
                            onChange={(e) => setEditingSubcategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleUpdatePendingSubcategory(pending.tempId);
                              } else if (e.key === "Escape") {
                                cancelEditingSubcategory();
                              }
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleUpdatePendingSubcategory(pending.tempId)}
                            disabled={!editingSubcategoryName.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditingSubcategory}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm">{pending.name}</span>
                          <span className="text-xs text-muted-foreground px-2">Pending</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditingPendingSubcategory(pending)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeletePendingSubcategory(pending.tempId)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {/* Show created subcategories */}
                  {subcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded"
                    >
                      {editingSubcategoryId === subcategory.id ? (
                        <>
                          <Input
                            value={editingSubcategoryName}
                            onChange={(e) => setEditingSubcategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleUpdateSubcategory(subcategory.id);
                              } else if (e.key === "Escape") {
                                cancelEditingSubcategory();
                              }
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleUpdateSubcategory(subcategory.id)}
                            disabled={isSubmittingSubcategory || !editingSubcategoryName.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={cancelEditingSubcategory}
                            disabled={isSubmittingSubcategory}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm">{subcategory.name}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditingSubcategory(subcategory)}
                            disabled={isSubmittingSubcategory}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                            disabled={isSubmittingSubcategory}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                // Reload data when closing dialog
                onSuccess?.();
              }}
              disabled={isSubmitting || isSubmittingSubcategory}
            >
              {currentCategoryId && !category ? "Done" : "Cancel"}
            </Button>
            {!currentCategoryId && (
              <Button type="submit" disabled={isSubmitting || !form.watch("name") || !form.watch("macroId")}>
                {isSubmitting ? "Saving..." : "Create"}
              </Button>
            )}
            {currentCategoryId && category && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Update"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


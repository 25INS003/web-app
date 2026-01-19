"use client";

import { useEffect, useState } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreVertical, Loader2, AlertCircle, Plus, ChevronRight, FolderTree, Trash2, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CategoriesManager() {
  const {
    categories = [],
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
    error,
  } = useCategoryStore();

  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_category_id: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build tree structure for display
  const buildCategoryTree = (categories, parentId = null, depth = 0) => {
    return categories
      .filter((cat) => {
        if (parentId === null) {
          return !cat.parent_category_id;
        }
        return cat.parent_category_id === parentId;
      })
      .map((cat) => ({
        ...cat,
        depth,
        children: buildCategoryTree(categories, cat._id, depth + 1),
      }));
  };

  // Flatten tree for display with indentation info
  const flattenTree = (tree, result = []) => {
    tree.forEach((node) => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        flattenTree(node.children, result);
      }
    });
    return result;
  };

  const categoryTree = buildCategoryTree(categories);
  const flatCategories = flattenTree(categoryTree);

  // Get root categories for parent selector
  const getRootAndParentOptions = () => {
    return categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      depth: cat.depth || 0,
      parent_category_id: cat.parent_category_id,
    }));
  };

  // Calculate display name with ancestry
  const getCategoryPath = (categoryId) => {
    const paths = [];
    let currentId = categoryId;
    let iterations = 0;
    
    while (currentId && iterations < 10) {
      const cat = categories.find((c) => c._id === currentId);
      if (!cat) break;
      paths.unshift(cat.name);
      currentId = cat.parent_category_id;
      iterations++;
    }
    
    return paths.join(" › ");
  };

  // Safely check if categories is valid
  const safeCategories = Array.isArray(categories) ? categories : [];
  const hasCategories = safeCategories.length > 0;

  // Initial fetch on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLocalError(null);
        await fetchCategories?.();
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to fetch categories");
      }
    };

    if (!hasCategories) {
      fetchData();
    }
  }, [fetchCategories, hasCategories]);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await createCategory({
        name: formData.name.trim(),
        description: formData.description.trim(),
        parent_category_id: formData.parent_category_id || null,
      });
      toast.success("Category created successfully");
      setIsCreateOpen(false);
      setFormData({ name: "", description: "", parent_category_id: null });
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateCategory(editingCategory._id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        parent_category_id: formData.parent_category_id || null,
      });
      toast.success("Category updated successfully");
      setIsEditOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "", parent_category_id: null });
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      parent_category_id: category.parent_category_id || null,
    });
    setIsEditOpen(true);
  };

  const handleDelete = async (id) => {
    if (!id) {
      setLocalError("Invalid category ID");
      return;
    }

    // Check if category has children
    const hasChildren = categories.some((cat) => cat.parent_category_id === id);
    if (hasChildren) {
      toast.error("Cannot delete category with subcategories. Delete children first.");
      return;
    }

    try {
      setDeleteLoadingId(id);
      setLocalError(null);
      
      if (typeof deleteCategory === "function") {
        await deleteCategory(id);
        toast.success("Category deleted successfully");
      } else {
        throw new Error("Delete function not available");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to delete category");
      toast.error("Failed to delete category");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Count children
  const getChildCount = (categoryId) => {
    return categories.filter((cat) => cat.parent_category_id === categoryId).length;
  };

  // Handle loading state
  if (isLoading && !hasCategories) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading categories...</span>
      </div>
    );
  }

  // Show error state if there's an error
  const displayError = error || localError;
  if (displayError && !hasCategories) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {displayError}. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderTree className="h-6 w-6" />
          Categories ({safeCategories.length})
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchCategories?.()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
          
          {/* Create Category Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Create a new category. Select a parent to create a subcategory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Category name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parent">Parent Category (Optional)</Label>
                  <Select
                    value={formData.parent_category_id || "none"}
                    onValueChange={(value) => 
                      setFormData({ ...formData, parent_category_id: value === "none" ? null : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parent (Root Category)</SelectItem>
                      {getRootAndParentOptions().map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {"—".repeat(cat.depth || 0)} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details. Change parent to move it in the hierarchy.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-parent">Parent Category</Label>
              <Select
                value={formData.parent_category_id || "none"}
                onValueChange={(value) => 
                  setFormData({ ...formData, parent_category_id: value === "none" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Parent (Root Category)</SelectItem>
                  {getRootAndParentOptions()
                    .filter((cat) => cat._id !== editingCategory?._id) // Can't be own parent
                    .map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {"—".repeat(cat.depth || 0)} {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Display any errors that occur during operations */}
      {displayError && hasCategories && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {!hasCategories && !isLoading && !displayError ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">No categories found.</p>
          <Button
            onClick={() => fetchCategories?.()}
            variant="outline"
            className="mt-2"
          >
            Load Categories
          </Button>
        </div>
      ) : (
        <ul className="space-y-1">
          {flatCategories.map((cat) => {
            if (!cat || typeof cat !== "object") {
              return null;
            }

            const categoryId = cat?._id || cat?.id;
            const categoryName = cat?.name || "Unnamed Category";
            const depth = cat?.depth || 0;
            const childCount = getChildCount(categoryId);

            if (!categoryId) {
              return null;
            }

            return (
              <li
                key={categoryId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                style={{ marginLeft: `${depth * 24}px` }}
              >
                <div className="flex items-center gap-2">
                  {depth > 0 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{categoryName}</span>
                      {childCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {childCount} sub
                        </Badge>
                      )}
                      {depth > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Level {depth}
                        </Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setFormData({
                        name: "",
                        description: "",
                        parent_category_id: categoryId,
                      });
                      setIsCreateOpen(true);
                    }}
                    title="Add subcategory"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(cat)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(categoryId)}
                    disabled={deleteLoadingId === categoryId || childCount > 0}
                    title={childCount > 0 ? "Delete children first" : "Delete"}
                  >
                    {deleteLoadingId === categoryId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
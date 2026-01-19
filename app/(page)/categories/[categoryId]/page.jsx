"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCategoryStore } from "@/store/categoryStore";
import { useForm } from "react-hook-form";
import Link from "next/link";
import {
  Layers,
  Plus,
  ArrowLeft,
  ImageIcon,
  Loader2,
  FolderTree,
  ChevronRight,
  Edit,
  Trash2,
  Home,
  MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// ==========================================
// Create Subcategory Dialog
// ==========================================
const CreateSubcategoryDialog = ({ open, onOpenChange, parentCategory, onSuccess }) => {
  const { createCategory, isLoading } = useCategoryStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      display_order: 0,
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setSelectedFile(null);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("description", data.description?.trim() || "");
      formData.append("parent_category_id", parentCategory?._id || "");
      formData.append("display_order", (parseInt(data.display_order) || 0).toString());
      formData.append("is_active", "true");

      // Handle optional image - use selectedFile state
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      await createCategory(formData);

      toast.success(`Subcategory "${data.name}" created successfully!`);
      reset();
      setImagePreview(null);
      setSelectedFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create subcategory", error);
      toast.error(error.message || "Failed to create subcategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset preview when dialog closes
  useEffect(() => {
    if (!open) {
      setImagePreview(null);
      setSelectedFile(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            Create Subcategory
          </DialogTitle>
          <DialogDescription>
            Creating subcategory inside:{" "}
            <span className="font-semibold text-foreground">{parentCategory?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subcategory Name *</label>
            <Input
              {...register("name", { required: "Name is required" })}
              placeholder="e.g. Smartphones"
              autoFocus
            />
            {errors.name && (
              <span className="text-red-500 text-xs">{errors.name.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              {...register("description")}
              placeholder="Short description..."
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Order</label>
              <Input
                type="number"
                {...register("display_order")}
                placeholder="0"
                min={0}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Image (Optional)
              </label>
              <Input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="cursor-pointer file:text-blue-600 file:font-semibold file:bg-blue-50 hover:file:bg-blue-100 text-xs"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-slate-50">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => { setImagePreview(null); setSelectedFile(null); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {(isSubmitting || isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Subcategory
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ==========================================
// Edit Category Dialog
// ==========================================
const EditCategoryDialog = ({ open, onOpenChange, category, onSuccess }) => {
  const { updateCategory, isLoading } = useCategoryStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      display_order: 0,
    },
  });

  // Update form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name || "",
        description: category.description || "",
        display_order: category.display_order || 0,
      });
      // Set existing image as preview
      setImagePreview(category.image_url || category.image || null);
      setRemoveImage(false);
      setSelectedFile(null);
    }
  }, [category, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setRemoveImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setRemoveImage(true);
    setSelectedFile(null);
  };

  const onSubmit = async (data) => {
    if (!category) return;
    
    setIsSubmitting(true);
    try {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("description", data.description?.trim() || "");
      formData.append("display_order", (parseInt(data.display_order) || 0).toString());

      // Handle image - use selectedFile state
      if (selectedFile) {
        formData.append("image", selectedFile);
      } else if (removeImage) {
        formData.append("remove_image", "true");
      }

      await updateCategory(category._id, formData);

      toast.success(`Category "${data.name}" updated successfully!`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update category", error);
      toast.error(error.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-500" />
            Edit Category
          </DialogTitle>
          <DialogDescription>
            Update the details for "{category?.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category Name *</label>
            <Input
              {...register("name", { required: "Name is required" })}
              placeholder="Category name"
              autoFocus
            />
            {errors.name && (
              <span className="text-red-500 text-xs">{errors.name.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              {...register("description")}
              placeholder="Short description..."
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Order</label>
              <Input
                type="number"
                {...register("display_order")}
                placeholder="0"
                min={0}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Image (Optional)
              </label>
              <Input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="cursor-pointer file:text-blue-600 file:font-semibold file:bg-blue-50 hover:file:bg-blue-100 text-xs"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && !removeImage && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-slate-50">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemoveImage}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {(isSubmitting || isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ==========================================
// Subcategory Card (clickable to go deeper)
// ==========================================
const SubcategoryCard = ({ category, onEdit }) => {
  const router = useRouter();
  const { categories } = useCategoryStore();
  
  // Count children from flat list
  const childCount = categories.filter(
    (cat) => cat.parent_category_id === category._id
  ).length;

  const imageUrl = category.image_url || category.image;

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit?.(category);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:ring-2 hover:ring-blue-500/50 group"
      onClick={() => router.push(`/categories/${category._id}`)}
    >
      <div className="relative h-32 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
            <ImageIcon className="h-10 w-10 mb-1 opacity-50" />
            <span className="text-xs">No Image</span>
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/90 dark:bg-slate-800/90 text-xs">
            Order: {category.display_order || 0}
          </Badge>
        </div>

        {/* Edit Button - Top Left */}
        <div className="absolute top-2 left-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-7 w-7 bg-white/90 dark:bg-slate-800/90 shadow-sm backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleEditClick}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
              {category.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {category.description || "No description"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
        </div>

        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {childCount > 0 ? (
            <Badge variant="default" className="text-[10px]">
              {childCount} subcategories
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] opacity-70">
              No subcategories
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ==========================================
// Category Detail Page
// ==========================================
const CategoryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId;

  const {
    categories,
    fetchCategories,
    fetchCategoryAncestry,
    deleteCategory,
    isLoading,
  } = useCategoryStore();

  const [currentCategory, setCurrentCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [ancestry, setAncestry] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Find current category and its children
  useEffect(() => {
    if (categories.length > 0 && categoryId) {
      const found = categories.find((cat) => cat._id === categoryId);
      setCurrentCategory(found);

      // Find children (subcategories)
      // Handle both populated (object) and unpopulated (string) parent_category_id
      const children = categories.filter((cat) => {
        const parentId = cat.parent_category_id;
        if (!parentId) return false;
        // If populated (object with _id), compare _id
        if (typeof parentId === "object" && parentId._id) {
          return parentId._id === categoryId;
        }
        // If string, compare directly
        return parentId === categoryId;
      });
      setSubcategories(children);

      // Build ancestry for breadcrumb
      buildAncestry(categoryId);
    }
  }, [categories, categoryId]);

  const buildAncestry = async (catId) => {
    const path = [];
    let currentId = catId;
    let iterations = 0;

    while (currentId && iterations < 10) {
      const cat = categories.find((c) => c._id === currentId);
      if (!cat) break;
      path.unshift(cat);
      // Handle both populated (object) and unpopulated (string) parent_category_id
      const parentId = cat.parent_category_id;
      if (parentId && typeof parentId === "object" && parentId._id) {
        currentId = parentId._id;
      } else {
        currentId = parentId;
      }
      iterations++;
    }

    setAncestry(path);
  };

  const handleDelete = async () => {
    if (!currentCategory) return;

    if (subcategories.length > 0) {
      toast.error("Cannot delete category with subcategories. Delete them first.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${currentCategory.name}"?`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteCategory(currentCategory._id);
      toast.success("Category deleted successfully");

      // Navigate to parent or categories list
      if (currentCategory.parent_category_id) {
        router.push(`/categories/${currentCategory.parent_category_id}`);
      } else {
        router.push("/categories");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    fetchCategories();
  };

  const handleEditCurrentCategory = () => {
    setEditingCategory(currentCategory);
    setIsEditOpen(true);
  };

  const handleEditSubcategory = (category) => {
    setEditingCategory(category);
    setIsEditOpen(true);
  };

  if (isLoading && !currentCategory) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-muted-foreground">Loading category...</p>
      </div>
    );
  }

  if (!currentCategory && !isLoading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="py-16">
          <FolderTree className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold mb-2">Category Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The category you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/categories")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  const imageUrl = currentCategory?.image_url || currentCategory?.image;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/categories" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Categories
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {ancestry.map((cat, index) => (
            <React.Fragment key={cat._id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === ancestry.length - 1 ? (
                  <BreadcrumbPage>{cat.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={`/categories/${cat._id}`}>{cat.name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Category Header */}
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="w-full md:w-64 h-48 md:h-auto bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={currentCategory?.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <ImageIcon className="h-16 w-16 mb-2 opacity-50" />
                <span className="text-sm">No Image</span>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {currentCategory?.name}
                  </h1>
                  {currentCategory?.depth > 0 && (
                    <Badge variant="outline">Level {currentCategory?.depth}</Badge>
                  )}
                </div>
                <p className="text-muted-foreground max-w-xl">
                  {currentCategory?.description || "No description provided."}
                </p>

                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span>
                    <strong>{subcategories.length}</strong> subcategories
                  </span>
                  <span>•</span>
                  <span>
                    Order: <strong>{currentCategory?.display_order || 0}</strong>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="shadow-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEditCurrentCategory}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting || subcategories.length > 0}
                  title={
                    subcategories.length > 0
                      ? "Delete subcategories first"
                      : "Delete category"
                  }
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Subcategories Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            Subcategories
            {subcategories.length > 0 && (
              <Badge variant="secondary">{subcategories.length}</Badge>
            )}
          </h2>
        </div>

        {subcategories.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <FolderTree className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              No Subcategories Yet
            </h3>
            <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
              Create subcategories to organize products within "{currentCategory?.name}"
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Subcategory
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subcategories.map((subcat) => (
              <SubcategoryCard 
                key={subcat._id} 
                category={subcat} 
                onEdit={handleEditSubcategory}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Subcategory Dialog */}
      <CreateSubcategoryDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        parentCategory={currentCategory}
        onSuccess={handleRefresh}
      />

      {/* Edit Category Dialog */}
      <EditCategoryDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        category={editingCategory}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default CategoryDetailPage;

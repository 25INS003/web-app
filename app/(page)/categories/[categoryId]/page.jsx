"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCategoryStore } from "@/store/categoryStore";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Settings,
  Upload,
  Image as LucideImage,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

// ... (keeping imports and other code same)

// ==========================================
// Image Upload Component (Drag & Drop)
// ==========================================
const ImageUpload = ({ imagePreview, onImageChange, onRemove }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onImageChange(file);
      } else {
        toast.error("Please upload an image file");
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onImageChange(e.target.files[0]);
    }
  };

  if (imagePreview) {
    return (
      <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 group shadow-sm">
        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClick}
            className="rounded-xl bg-white/90 hover:bg-white text-slate-900 shadow-lg"
          >
            Change Image
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onRemove}
            className="rounded-xl shadow-lg"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-32 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 p-6 text-center group
        ${isDragActive 
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 scale-[1.02]" 
          : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50"
        }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className={`p-4 rounded-full transition-colors duration-300 
        ${isDragActive 
          ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600" 
          : "bg-white dark:bg-slate-700 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-slate-600 shadow-sm"
        }`}>
        <Upload className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
          <span className="text-blue-500 hover:underline">Click to upload</span> or drag and drop
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          SVG, PNG, JPG or GIF (max. 5MB)
        </p>
      </div>
    </div>
  );
};




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

  const handleImageChange = (file) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (e) => {
    if (e) e.stopPropagation();
    setImagePreview(null);
    setSelectedFile(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("description", data.description?.trim() || "");
      formData.append("parent_category_id", parentCategory?._id || "");
      formData.append("display_order", (parseInt(data.display_order) || 0).toString());
      formData.append("is_active", "true");

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      await createCategory(formData);
      toast.success(`Subcategory "${data.name}" created successfully!`);
      reset();
      handleRemoveImage();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create subcategory", error);
      toast.error(error.message || "Failed to create subcategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      handleRemoveImage();
      reset();
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/10">
              <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            Create Subcategory
          </DialogTitle>
          <DialogDescription>
            Creating subcategory inside: <span className="font-semibold text-slate-900 dark:text-white">{parentCategory?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subcategory Name *</label>
            <Input
              {...register("name", { required: "Name is required" })}
              placeholder="e.g. Smartphones"
              autoFocus
              className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
            />
            {errors.name && (
              <span className="text-red-500 text-xs">{errors.name.message}</span>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <Textarea
              {...register("description")}
              placeholder="Short description..."
              className="resize-none rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              rows={3}
            />
          </div>

          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Order</label>
             <Input
                type="number"
                {...register("display_order")}
                placeholder="0"
                min={0}
                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category Image</label>
            <ImageUpload 
              imagePreview={imagePreview} 
              onImageChange={handleImageChange} 
              onRemove={handleRemoveImage}
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl flex-1 sm:flex-none">
              Cancel
            </Button>
            <motion.div className="flex-1 sm:flex-none" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" disabled={isSubmitting || isLoading} className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25">
                {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Subcategory
              </Button>
            </motion.div>
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

  useEffect(() => {
    if (category) {
      reset({
        name: category.name || "",
        description: category.description || "",
        display_order: category.display_order || 0,
      });
      setImagePreview(category.image_url || category.image || null);
      setRemoveImage(false);
      setSelectedFile(null);
    }
  }, [category, reset]);

  const handleImageChange = (file) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setRemoveImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (e) => {
    if (e) e.stopPropagation();
    setImagePreview(null);
    setRemoveImage(true);
    setSelectedFile(null);
  };

  const onSubmit = async (data) => {
    if (!category) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("description", data.description?.trim() || "");
      formData.append("display_order", (parseInt(data.display_order) || 0).toString());

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10">
              <Edit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            Edit Category
          </DialogTitle>
          <DialogDescription>
            Update the details for "<span className="font-semibold">{category?.name}</span>"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category Name *</label>
            <Input
              {...register("name", { required: "Name is required" })}
              placeholder="Category name"
              autoFocus
              className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
            />
            {errors.name && (
              <span className="text-red-500 text-xs">{errors.name.message}</span>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <Textarea
              {...register("description")}
              placeholder="Short description..."
              className="resize-none rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              rows={3}
            />
          </div>

          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Order</label>
             <Input
                type="number"
                {...register("display_order")}
                placeholder="0"
                min={0}
                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category Image</label>
            <ImageUpload 
              imagePreview={imagePreview} 
              onImageChange={handleImageChange} 
              onRemove={handleRemoveImage}
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl flex-1 sm:flex-none">
              Cancel
            </Button>
            <motion.div className="flex-1 sm:flex-none" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" disabled={isSubmitting || isLoading} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25">
                {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ==========================================
// Subcategory Card
// ==========================================
const SubcategoryCard = ({ category, onEdit, index }) => {
  const router = useRouter();
  const { categories } = useCategoryStore();
  
  // Safe default for categories
  const safeCategories = Array.isArray(categories) ? categories : [];
  
  const childCount = safeCategories.filter(
    (cat) => cat.parent_category_id === category._id || (cat.parent_category_id && cat.parent_category_id._id === category._id)
  ).length;

  const imageUrl = category.image_url || category.image;

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit?.(category);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => router.push(`/categories/${category._id}`)}
      className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-pointer group"
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Image Header */}
      <div className="relative h-32 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image';
            }}
          />
        ) : (
          <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
            <ImageIcon className="h-10 w-10 mb-1 opacity-50" />
            <span className="text-xs">No Image</span>
          </div>
        )}
        
        {/* Order Badge */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-sm text-xs rounded-lg px-2 py-0.5">
            Order: {category.display_order || 0}
          </Badge>
        </div>

        {/* Menu Button */}
        <div className="absolute top-2 left-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button 
                className="h-7 w-7 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 rounded-lg shadow-sm backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-44 p-2 rounded-2xl bg-slate-900 border-slate-700 shadow-xl" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2 py-1.5 mb-1">
                <p className="text-sm font-semibold text-white">Category</p>
              </div>
              <div className="h-px bg-slate-700 mb-2" />
              
              <DropdownMenuItem 
                onClick={handleEditClick}
                className="rounded-xl px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-white"
              >
                <Settings className="mr-3 h-4 w-4 text-slate-400" />
                Edit Category
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="rounded-xl px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-red-300"
              >
                <Trash2 className="mr-3 h-4 w-4" />
                Delete Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white truncate">
              {category.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {category.description || "No description"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Badge 
            className={`text-[10px] rounded-lg px-2 py-0.5 ${
              childCount > 0 
                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
          >
            {childCount > 0 ? `${childCount} subcategories` : 'No subcategories'}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

// ==========================================
// Category Detail Page
// ==========================================
const CategoryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  
  // Safe access to categoryId
  const categoryId = params?.categoryId;

  const {
    categories,
    fetchCategories,
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
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only fetch if we haven't already or if empty
    if (!categories || categories.length === 0) {
      fetchCategories();
    }
    setHasInitialized(true);
  }, [fetchCategories, categories]);

  useEffect(() => {
    if (categories && categories.length > 0 && categoryId) {
      const found = categories.find((cat) => cat._id === categoryId);
      setCurrentCategory(found);

      const children = categories.filter((cat) => {
        const parentId = cat.parent_category_id;
        if (!parentId) return false;
        if (typeof parentId === "object" && parentId._id) {
          return parentId._id === categoryId;
        }
        return parentId === categoryId;
      });
      setSubcategories(children);
      buildAncestry(categoryId);
    }
  }, [categories, categoryId]);

  const buildAncestry = async (catId) => {
    if (!categories) return;
    const path = [];
    let currentId = catId;
    let iterations = 0;

    while (currentId && iterations < 10) {
      const cat = categories.find((c) => c._id === currentId);
      if (!cat) break;
      path.unshift(cat);
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

  // Safe checks for rendering
  if (!categoryId) return null;

  // Show loading during initial fetch or logic
  if ((isLoading && !currentCategory) || (!hasInitialized && !currentCategory)) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-slate-500 dark:text-slate-400">Loading category...</p>
      </div>
    );
  }

  // Not found state - only if we have initialized and confirmed category doesn't exist
  if (!currentCategory && hasInitialized && !isLoading) {
    return (
      <motion.div 
        className="container mx-auto p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 inline-block mb-4">
            <FolderTree className="h-12 w-12 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Category Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            The category you're looking for doesn't exist.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => router.push("/categories")} className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Fallback for first render if not trapped above
  if (!currentCategory) return null;

  const imageUrl = currentCategory?.image_url || currentCategory?.image;

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-8 max-w-6xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
           <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/categories" className="flex items-center gap-1.5">
                  <Home className="h-4 w-4" />
                  Categories
                </Link>
              </BreadcrumbLink>
           </BreadcrumbItem>
           <BreadcrumbSeparator />
           
           {ancestry.map((cat, index) => (
            <React.Fragment key={cat._id}>
              {index > 0 && <BreadcrumbSeparator />}
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

      {/* Category Header Card */}
      <motion.div 
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
      >
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="w-full md:w-56 h-48 md:h-auto bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={currentCategory?.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image';
                }}
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <ImageIcon className="h-14 w-14 mb-2 opacity-50" />
                <span className="text-sm">No Image</span>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                    {currentCategory?.name}
                  </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                  {currentCategory?.description || "No description provided."}
                </p>

                <div className="flex items-center gap-4 mt-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-900 dark:text-white">{subcategories.length}</span> subcategories
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>
                    Order: <span className="font-semibold text-slate-900 dark:text-white">{currentCategory?.display_order || 0}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subcategory
                  </Button>
                </motion.div>
                <Button
                  variant="outline"
                  onClick={handleEditCurrentCategory}
                  className="rounded-xl"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-xl"
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
      </motion.div>

      {/* Subcategories Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Subcategories
            {subcategories.length > 0 && (
              <Badge className="ml-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {subcategories.length}
              </Badge>
            )}
          </h2>
        </div>

        {subcategories.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 inline-block mb-4">
              <FolderTree className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              No Subcategories Yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-sm mx-auto">
              Create subcategories to organize products within "{currentCategory?.name}"
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Create First Subcategory
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {subcategories.map((category, index) => (
              <SubcategoryCard 
                key={category._id} 
                category={category} 
                index={index}
                onEdit={handleEditSubcategory}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Dialogs */}
      <CreateSubcategoryDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        parentCategory={currentCategory}
        onSuccess={handleRefresh}
      />
      <EditCategoryDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        category={editingCategory}
        onSuccess={handleRefresh}
      />
    </motion.div>
  );
};

export default CategoryDetailPage;

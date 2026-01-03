"use client";

import React, { useEffect, useState } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import { useForm } from "react-hook-form";
import {
    Layers,
    Plus,
    Search,
    ChevronDown,
    ChevronUp,
    ImageIcon,
    Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
// Using sonner or your preferred toast provider is recommended here for error feedback
// import { toast } from "sonner"; 

// Helper to flatten categories for the "Parent" select dropdown
const flattenCategories = (categories, level = 0) => {
    let flat = [];
    if (!categories) return flat;
    categories.forEach(cat => {
        flat.push({ ...cat, level });
        if (cat.subcategories && cat.subcategories.length > 0) {
            flat = flat.concat(flattenCategories(cat.subcategories, level + 1));
        }
    });
    return flat;
};

// ==========================================
// Add/Edit Category Dialog
// ==========================================
const CategoryDialog = ({ open, onOpenChange, parentId = null }) => {
    const { createCategory, categories, isLoading } = useCategoryStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Flatten categories for the dropdown
    const flatCategories = flattenCategories(categories);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            name: "",
            description: "",
            parent_id: parentId || "",
            display_order: 0,
            is_active: true,
            image: null // Initialize image as null
        }
    });

    // Watch parent_id to auto-calculate the "+1" order logic
    const selectedParentId = watch("parent_id");

    useEffect(() => {
        if (selectedParentId) {
            // Find the selected parent
            const parent = flatCategories.find(c => c._id === selectedParentId || c.category_id === selectedParentId);
            if (parent) {
                // LOGIC: New child category will be increased by one (+1) from parent
                const parentOrder = parent.display_order || 0;
                setValue("display_order", parentOrder + 1);
            }
        } else {
            // Default for root categories
            setValue("display_order", 0);
        }
    }, [selectedParentId, flatCategories, setValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // ============================================================
            // CHANGED: Use FormData for file uploads instead of JSON object
            // ============================================================
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("description", data.description || "");
            // Ensure display_order is sent as a number or string representation of a number
            formData.append("display_order", data.display_order.toString());
            formData.append("is_active", data.is_active);

            // Handle parent_id: Only append if it's not an empty string
            if (data.parent_id) {
                formData.append("parent_id", data.parent_id);
            }

            // Handle image file upload
            // data.image is a FileList returned by the file input. We take the first file.
            if (data.image && data.image.length > 0) {
                formData.append("image", data.image[0]);
            }

            // The createCategory action in your store needs to accept FormData
            await createCategory(formData);

            reset();
            onOpenChange(false);
            // toast.success("Category created successfully");
        } catch (error) {
            console.error("Failed to create category", error);
            // toast.error(error.message || "Failed to create category");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                        Create a category.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category Name *</label>
                        <Input
                            {...register("name", { required: "Name is required" })}
                            placeholder="e.g. Electronics"
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>

                    {/* Parent Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Parent Category</label>
                        <select
                            {...register("parent_id")}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="">None</option>
                            {flatCategories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {/* Visual indentation for hierarchy */}
                                    {'\u00A0\u00A0'.repeat(cat.level)} {cat.name} (Order: {cat.display_order || 0})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Order Number (Read Only) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Order Number</label>
                            <Input
                                type="number"
                                {...register("display_order")}
                                readOnly
                                className="bg-gray-50 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <ImageIcon size={16} /> Category Image
                            </label>
                            <Input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                className="cursor-pointer file:text-blue-600 file:font-semibold file:bg-blue-50 hover:file:bg-blue-100"
                                {...register("image")}
                            />
                        </div>
                    </div>

                    {/* Description Textarea */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            {...register("description")}
                            placeholder="Short description..."
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || isLoading}>
                            {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Category
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// ==========================================
// Category Card Component (Recursive)
// ==========================================
const CategoryCard = ({ category, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = category.subcategories && category.subcategories.length > 0;

    // Ensure image path is correct (sometimes backend sends relative paths)
    const imageUrl = category.image?.startsWith('http')
        ? category.image
        : category.image
            ? `${process.env.NEXT_PUBLIC_API_URL || ''}${category.image}`
            : null;

    return (
        <Card className={`overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'} border-slate-200 dark:border-slate-800`}>
            {/* Card Main Content */}
            <div
                className="cursor-pointer group"
                onClick={() => hasChildren && setIsOpen(!isOpen)}
            >
                {/* Image Header Container */}
                <div className="relative h-40 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image'; // Fallback image
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center text-slate-400 dark:text-slate-600 transition-colors group-hover:text-slate-500">
                            <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                            <span className="text-xs font-medium">No Image Available</span>
                        </div>
                    )}

                    {/* Badge for Order/Level */}
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-white/90 dark:bg-slate-800/90 shadow-sm backdrop-blur-sm text-xs">
                            Order: {category.display_order !== undefined ? category.display_order : 0}
                        </Badge>
                    </div>
                </div>

                <div className="p-4">
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 line-clamp-1">
                                {category.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[40px]">
                                {category.description || "No description provided."}
                            </p>
                        </div>
                        {hasChildren && (
                            <button className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0 mt-1">
                                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-muted-foreground">
                        <Badge variant={hasChildren ? "default" : "outline"} className={`text-[10px] ${!hasChildren && "opacity-70"}`}>
                            {hasChildren ? `${category.subcategories.length} SUB-CATEGORIES` : 'NO SUB-CATEGORIES'}
                        </Badge>
                        {category.productCount !== undefined && category.productCount > 0 && (
                            <span className="flex items-center gap-1">
                                <span className="h-1 w-1 rounded-full bg-slate-300 inline-block"></span>
                                {category.productCount} Products
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Child Categories (Opened inside) */}
            {isOpen && hasChildren && (
                <div className="bg-slate-50/80 dark:bg-slate-900/50 border-t p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Layers size={14} className="text-blue-500" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            Inside: {category.name}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                        {category.subcategories.map((child) => (
                            <CategoryCard key={child._id} category={child} level={level + 1} />
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

// ==========================================
// Main Categories Page
// ==========================================
const CategoriesPage = () => {
    const { categories, fetchCategories, isLoading } = useCategoryStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        // Ensure data is fetched on mount
        fetchCategories();
    }, [fetchCategories]);

    // Simple search filter (top level only for cleaner UI, or adjust as needed)
    const filteredCategories = categories ? categories.filter(cat =>
        cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-800 dark:text-slate-100">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Layers className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        Categories
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 md:ml-14 max-w-2xl">
                        Organize your products into hierarchical categories. Click on a category card to view its sub-categories.
                    </p>
                </div>

                <Button onClick={() => setIsCreateOpen(true)} size="lg" className="shadow-sm w-full md:w-auto">
                    <Plus className="mr-2 h-5 w-5" />
                    Add New Category
                </Button>
            </div>

            {/* Search Bar & Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search root categories..."
                        className="pl-10 bg-white dark:bg-slate-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Badge variant="outline" className="hidden sm:flex px-3 py-1 h-9 items-center gap-1 text-sm">
                    Total Categories: {filteredCategories.length}
                </Badge>
            </div>

            {/* Categories Grid */}
            {isLoading && filteredCategories.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 gap-4 text-muted-foreground">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <p>Loading categories hierarchy...</p>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <Layers className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Categories Found</h3>
                    <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
                        {searchTerm ? `No results for "${searchTerm}"` : "Get started by adding your first product category."}
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                    {filteredCategories.map((category) => (
                        <CategoryCard key={category._id} category={category} />
                    ))}
                </div>
            )}

            {/* Add Category Modal */}
            <CategoryDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />
        </div>
    );
};

export default CategoriesPage;
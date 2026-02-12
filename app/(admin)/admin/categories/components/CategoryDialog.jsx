"use client";

import React, { useEffect, useState } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
    Plus,
    ImageIcon,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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

export function CategoryDialog({ open, onOpenChange, parentId = null }) {
    const { createCategory, categories, isLoading } = useCategoryStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const flatCategories = flattenCategories(categories);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            name: "",
            description: "",
            parent_id: parentId || "",
            display_order: 0,
            is_active: true,
            image: null
        }
    });

    const selectedParentId = watch("parent_id");

    // Reset parent_id when the prop changes (e.g. detailed view of a different category)
    useEffect(() => {
        if (open && parentId) {
            setValue("parent_id", parentId);
        } else if (open && !parentId) {
            // Only reset if strict parentId is not enforced, otherwise keep what the user selected or default?
            // Actually better to respect the prop if provided, else keep existing behavior
        }
    }, [open, parentId, setValue]);

    useEffect(() => {
        if (selectedParentId) {
            const parent = flatCategories.find(c => c._id === selectedParentId || c.category_id === selectedParentId);
            if (parent) {
                const parentOrder = parent.display_order || 0;
                setValue("display_order", parentOrder + 1);
            }
        } else {
            setValue("display_order", 0);
        }
    }, [selectedParentId, flatCategories, setValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("description", data.description || "");
            formData.append("display_order", data.display_order.toString());
            formData.append("is_active", data.is_active);

            const effectiveParentId = parentId || data.parent_id;
            if (effectiveParentId) {
                formData.append("parent_category_id", effectiveParentId);
            }

            if (data.image && data.image.length > 0) {
                formData.append("image", data.image[0]);
            }

            await createCategory(formData);
            reset();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to create category", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 dark:border-slate-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                            <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        {parentId ? "Add Subcategory" : "Add New Category"}
                    </DialogTitle>
                    <DialogDescription>Create a category to organize your products.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category Name *</label>
                        <Input
                            {...register("name", { required: "Name is required" })}
                            placeholder="e.g. Electronics"
                            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Parent Category</label>
                        <select
                            {...register("parent_id")}
                            disabled={!!parentId} // Disable if parentId is forced via props
                            className={`flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${parentId ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <option value="">None (Root Category)</option>
                            {flatCategories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {'\u00A0\u00A0'.repeat(cat.level)} {cat.name} (Order: {cat.display_order || 0})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Order Number</label>
                            <Input
                                type="number"
                                {...register("display_order")}
                                readOnly
                                className="rounded-xl bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <ImageIcon size={14} /> Category Image
                            </label>
                            <Input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                className="rounded-xl cursor-pointer file:text-blue-600 file:font-semibold file:bg-blue-50 dark:file:bg-blue-500/10 hover:file:bg-blue-100"
                                {...register("image")}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                        <Textarea
                            {...register("description")}
                            placeholder="Short description..."
                            className="resize-none rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                            Cancel
                        </Button>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button type="submit" disabled={isSubmitting || isLoading} className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25">
                                {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Category
                            </Button>
                        </motion.div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

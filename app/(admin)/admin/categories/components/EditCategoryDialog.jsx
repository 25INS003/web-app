"use client";

import React, { useEffect, useState } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
    Edit,
    ImageIcon,
    Loader2,
    Trash2,
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
import { toast } from "sonner";

export function EditCategoryDialog({ open, onOpenChange, category, onSuccess }) {
    const { updateCategory, isLoading } = useCategoryStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: category?.name || "",
            description: category?.description || "",
            display_order: category?.display_order || 0,
        }
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
        if (!category?._id) return;
        
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
            toast.success("Category updated successfully!");
            onOpenChange(false);
            onSuccess?.();
            
            // Allow parent component to know update finished to refetch or update state
        } catch (error) {
            console.error("Failed to update category", error);
            toast.error(error.message || "Failed to update category");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 dark:border-slate-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10">
                            <Edit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        Edit Category
                    </DialogTitle>
                    <DialogDescription>Update category information</DialogDescription>
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
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                        <Textarea
                            {...register("description")}
                            placeholder="Short description..."
                            className="resize-none rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Order</label>
                            <Input
                                type="number"
                                {...register("display_order")}
                                min={0}
                                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> Image (Optional)
                            </label>
                            <Input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                className="rounded-xl cursor-pointer file:text-blue-600 file:font-semibold file:bg-blue-50 dark:file:bg-blue-500/10 text-xs"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    {imagePreview && !removeImage && (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 rounded-lg"
                                onClick={handleRemoveImage}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                            Cancel
                        </Button>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button type="submit" disabled={isSubmitting || isLoading} className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25">
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

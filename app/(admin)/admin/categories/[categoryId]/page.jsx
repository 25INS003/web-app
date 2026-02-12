"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCategoryStore } from "@/store/categoryStore";
import { motion } from "framer-motion";
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    ImageIcon, 
    Layers, 
    Calendar,
    CheckCircle,
    XCircle,
    FolderTree,
    Plus,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CategoryDialog } from "../components/CategoryDialog";
import { EditCategoryDialog } from "../components/EditCategoryDialog";

export default function CategoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { categoryId } = params;
    const { categories, fetchCategories, deleteCategory, isLoading } = useCategoryStore();
    
    // Dialog states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAddSubOpen, setIsAddSubOpen] = useState(false);

    // We try to find the category from the store first
    const category = categories.find(c => c._id === categoryId);
    
    // Subcategories
    const subcategories = categories.filter(c => c.parent_category_id === categoryId);

    useEffect(() => {
        if (!categories.length) {
            fetchCategories();
        }
    }, [categories.length, fetchCategories]);

    if (isLoading && !category) {
        return <div className="p-8 text-center text-slate-500">Loading category details...</div>;
    }

    if (!category && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                    <FolderTree className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Category Not Found</h2>
                <Button onClick={() => router.push("/admin/categories")} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
                </Button>
            </div>
        );
    }

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
            await deleteCategory(categoryId);
            toast.success("Category deleted");
            router.push("/admin/categories");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 container mx-auto p-6 max-w-6xl pb-20"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                        <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {category?.name}
                            </h1>
                            {category?.is_active ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none">Active</Badge>
                            ) : (
                                <Badge className="bg-slate-100 text-slate-500 border-slate-200">Inactive</Badge>
                            )}
                        </div>
                        <p className="text-slate-400 text-sm mt-1 font-mono">ID: {categoryId}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" onClick={() => setIsEditOpen(true)}>
                        <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <Button 
                        className="gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0"
                        onClick={() => setIsAddSubOpen(true)}
                    >
                        <Plus className="h-4 w-4" /> Add Subcategory
                    </Button>
                    <Button variant="destructive" size="icon" className="rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 border-0" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Description Card */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 p-6">
                                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">Description</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                    {category?.description || "No description provided for this category."}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Subcategories List */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 p-6 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">Subcategories</CardTitle>
                                <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-lg">
                                    {subcategories.length}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-6">
                                {subcategories.length > 0 ? (
                                    <div className="grid gap-3">
                                        {subcategories.map(sub => (
                                            <motion.div 
                                                key={sub._id}
                                                whileHover={{ scale: 1.01, x: 4 }}
                                                onClick={() => router.push(`/admin/categories/${sub._id}`)}
                                                className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500/30 hover:shadow-md cursor-pointer transition-all"
                                            >
                                                <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                                                    {sub.image_url ? (
                                                         <img src={sub.image_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <FolderTree className="h-6 w-6 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{sub.name}</h4>
                                                    <p className="text-sm text-slate-500 truncate">{sub.description || "No description"}</p>
                                                </div>
                                                <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                                                    <ChevronRight className="h-5 w-5" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                            <Layers className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">No subcategories yet</h3>
                                        <p className="text-sm text-slate-500 mt-1 mb-6 max-w-xs mx-auto">
                                            Create subcategories to organize your items inside {category?.name}.
                                        </p>
                                        <Button variant="outline" onClick={() => setIsAddSubOpen(true)} className="rounded-xl">
                                            <Plus className="mr-2 h-4 w-4" /> Add Subcategory
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Sidebar Info */}
                <motion.div variants={itemVariants} className="space-y-6">
                    {/* Image Card */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                         <div className="aspect-square w-full bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center p-1">
                            {category?.image_url || category?.image ? (
                                <img 
                                    src={category.image_url || category.image} 
                                    alt={category.name} 
                                    className="w-full h-full object-cover rounded-t-lg"
                                />
                            ) : (
                                <div className="flex flex-col items-center text-slate-400">
                                    <ImageIcon className="h-16 w-16 mb-3 opacity-50" />
                                    <span className="text-sm font-medium">No Image Uploaded</span>
                                </div>
                            )}
                        </div>
                        {/* <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <p className="text-xs text-center text-slate-500">Category Cover Image</p>
                        </div> */}
                    </Card>

                    {/* Metadata Card */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <CardTitle className="text-base font-semibold">Category Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500 flex items-center gap-2">
                                    <Layers size={16} className="text-blue-500" /> Display Order
                                </span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                    {category?.display_order || 0}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500 flex items-center gap-2">
                                    <Calendar size={16} className="text-purple-500" /> Created On
                                </span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {category?.createdAt ? new Date(category.createdAt).toLocaleDateString() : "N/A"}
                                </span>
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                <div className="flex items-center justify-between mb-2 mt-4">
                                     <span className="text-sm text-slate-500">Status</span>
                                </div>
                                {category?.is_active ? (
                                    <div className="flex items-center justify-center gap-2 w-full p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-sm border border-emerald-500/20">
                                        <CheckCircle size={14} /> Active Category
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 w-full p-2 rounded-lg bg-slate-100 text-slate-500 font-medium text-sm border border-slate-200">
                                        <XCircle size={14} /> Inactive
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Dialogs */}
            <EditCategoryDialog 
                open={isEditOpen} 
                onOpenChange={setIsEditOpen} 
                category={category}
                onSuccess={() => fetchCategories()} 
            />
            
            <CategoryDialog 
                open={isAddSubOpen} 
                onOpenChange={setIsAddSubOpen} 
                parentId={categoryId} 
            />
        </motion.div>
    );
}

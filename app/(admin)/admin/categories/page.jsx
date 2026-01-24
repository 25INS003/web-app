"use client";

import React, { useEffect, useState } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    ChevronRight,
    ImageIcon,
    Loader2,
    FolderTree,
    MoreVertical,
    Trash2,
    Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CategoryDialog } from "./components/CategoryDialog";
import { EditCategoryDialog } from "./components/EditCategoryDialog";

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

// ==========================================
// Category Card Component
// ==========================================
const CategoryCard = ({ category, onEdit, index }) => {
    const router = useRouter();
    const { categories } = useCategoryStore();
    
    const subcategoryCount = categories.filter(
        (cat) => cat.parent_category_id === category._id
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
            onClick={() => router.push(`/admin/categories/${category._id}`)}
            className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-pointer group"
        >
            {/* Hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Image Header */}
            <div className="relative h-40 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
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
                    <div className="flex flex-col items-center text-slate-400 dark:text-slate-600 transition-colors group-hover:text-slate-500">
                        <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                        <span className="text-xs font-medium">No Image</span>
                    </div>
                )}

                {/* Order Badge */}
                <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-sm text-xs rounded-lg px-2.5 py-1">
                        Order: {category.display_order !== undefined ? category.display_order : 0}
                    </Badge>
                </div>

                {/* Menu Button */}
                <div className="absolute top-3 left-3">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button 
                                className="h-8 w-8 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 rounded-lg shadow-sm backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            align="start" 
                            className="w-48 p-2 rounded-2xl bg-slate-900 border-slate-700 shadow-xl" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
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
            <div className="relative z-10 p-5">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1">
                            {category.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[40px]">
                            {category.description || "No description provided."}
                        </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Badge 
                        className={`text-[10px] rounded-lg px-2.5 py-1 ${
                            subcategoryCount > 0 
                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                    >
                        {subcategoryCount > 0 ? `${subcategoryCount} SUBCATEGORIES` : 'NO SUBCATEGORIES'}
                    </Badge>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                        Click to view →
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================
// Main Categories Page
// ==========================================
const CategoriesPage = () => {
    const { categories, fetchCategories, isLoading } = useCategoryStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const rootCategories = categories ? categories.filter(cat => !cat.parent_category_id) : [];
    const filteredCategories = rootCategories.filter(cat =>
        cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setIsEditOpen(true);
    };

    return (
        <motion.div 
            className="container mx-auto p-6 space-y-6 max-w-7xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                            <FolderTree className="h-6 w-6 text-white" />
                        </div>
                        Categories
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                        Organize your products into hierarchical categories. <span className="font-medium">Click on a category card</span> to view and create subcategories.
                    </p>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                        onClick={() => setIsCreateOpen(true)} 
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 px-5"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Root Category
                    </Button>
                </motion.div>
            </motion.div>

            {/* Search Bar & Stats */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 items-center justify-between"
            >
                <motion.div 
                    animate={{ 
                        scale: searchFocused ? 1.01 : 1,
                        boxShadow: searchFocused ? "0 4px 20px rgba(59, 130, 246, 0.15)" : "0 0 0 rgba(0,0,0,0)"
                    }}
                    className={`flex items-center rounded-2xl px-5 py-3.5 w-full sm:max-w-md transition-all duration-300 border-2 bg-white dark:bg-slate-800/60 ${
                        searchFocused 
                            ? 'border-blue-500' 
                            : 'border-slate-200 dark:border-slate-700'
                    }`}
                >
                    <Search className={`transition-colors ${searchFocused ? 'text-blue-500' : 'text-slate-400'}`} size={18} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        className="ml-3 w-full bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                </motion.div>

                <div className="flex gap-2">
                    <Badge className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm">
                        Root: {filteredCategories.length}
                    </Badge>
                    <Badge className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm">
                        Total: {categories?.length || 0}
                    </Badge>
                </div>
            </motion.div>

            {/* Categories Grid */}
            {isLoading && filteredCategories.length === 0 ? (
                <motion.div 
                    variants={itemVariants}
                    className="flex flex-col justify-center items-center h-64 gap-4"
                >
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <p className="text-slate-500 dark:text-slate-400">Loading categories...</p>
                </motion.div>
            ) : filteredCategories.length === 0 ? (
                <motion.div 
                    variants={itemVariants}
                    className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 inline-block mb-4">
                        <FolderTree className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Categories Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-sm mx-auto">
                        {searchTerm ? `No results for "${searchTerm}"` : "Get started by adding your first category."}
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredCategories.map((category, index) => (
                        <CategoryCard 
                            key={category._id} 
                            category={category} 
                            index={index}
                            onEdit={handleEditCategory}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <CategoryDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
            <EditCategoryDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                category={editingCategory}
            />
        </motion.div>
    );
};

export default CategoriesPage;

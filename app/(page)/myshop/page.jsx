"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useShopStore } from "@/store/shopStore";
import {
    Store,
    Plus,
    Trash2,
    MoreHorizontal,
    Loader2,
    MapPin,
    Phone,
    CheckCircle,
    Search,
    Settings,
    Edit,
    ShoppingBag,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.03, delayChildren: 0 }
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
// Main My Shops Page Component
// ==========================================
const MyShopsPage = () => {
    const router = useRouter();
    const { myShops, fetchMyShops, isLoading, error: storeError } = useShopStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => {
        fetchMyShops();
    }, [fetchMyShops]);

    const handleEditShop = (shopId) => {
        router.push(`/myshop/edit/${shopId}`);
    };

    const handleDeleteShop = async (shopId) => {
        if (!window.confirm("Are you sure you want to delete this shop?")) return;
    };

    const filteredShops = myShops?.filter(shop => {
        if (!searchTerm) return true; // Show all if no search term
        const term = searchTerm.toLowerCase();
        return (
            (shop.name && shop.name.toLowerCase().includes(term)) ||
            (shop.category && shop.category.toLowerCase().includes(term)) ||
            (shop.city && shop.city.toLowerCase().includes(term))
        );
    }) || [];

    const activeShops = myShops?.filter(s => s.status === 'active' || !s.status).length || 0;
    const totalProducts = myShops?.reduce((sum, s) => sum + (s.total_products || 0), 0) || 0;
    const totalOrders = myShops?.reduce((sum, s) => sum + (s.total_orders || 0), 0) || 0;

    const stats = [
        { title: "Total Shops", value: myShops?.length || 0, icon: Store, gradient: "from-blue-500 to-blue-600" },
        { title: "Active Shops", value: activeShops, icon: CheckCircle, gradient: "from-green-500 to-emerald-600" },
        { title: "Total Products", value: totalProducts, icon: Package, gradient: "from-purple-500 to-purple-600" },
        { title: "Total Orders", value: totalOrders, icon: ShoppingBag, gradient: "from-orange-500 to-orange-600" }
    ];

    return (
        <motion.div 
            className="container mx-auto p-6 space-y-6"
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
                            <Store className="h-6 w-6 text-white" />
                        </div>
                        My Shops
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Manage all your shops in one place
                    </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                        onClick={() => router.push("/myshop/add")}
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 px-5 py-2.5"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Shop
                    </Button>
                </motion.div>
            </motion.div>

            {storeError && (
                <motion.div 
                    variants={itemVariants}
                    className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-400 px-4 py-3 rounded-xl"
                >
                    {storeError}
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        variants={itemVariants}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    {stat.title}
                                </p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search Bar */}
            <motion.div 
                variants={itemVariants}
                className={`flex items-center rounded-2xl px-5 py-4 transition-all duration-300 border-2 bg-white dark:bg-slate-800/60 ${
                    searchFocused 
                        ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
                        : 'border-slate-200 dark:border-slate-700'
                }`}
            >
                <Search className={`transition-colors ${searchFocused ? 'text-blue-500' : 'text-slate-400'}`} size={20} />
                <input
                    type="text"
                    placeholder="Search shops by name, category, or city..."
                    className="ml-3 w-full bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                />
            </motion.div>

            {/* Content */}
            {isLoading ? (
                <motion.div 
                    variants={itemVariants}
                    className="flex justify-center items-center h-64"
                >
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                </motion.div>
            ) : filteredShops.length === 0 ? (
                <EmptyState onAdd={() => router.push("/myshop/add")} isSearch={!!searchTerm} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredShops.map((shop, index) => (
                        <ShopCard
                            key={shop._id}
                            shop={shop}
                            index={index}
                            onEdit={handleEditShop}
                            onDelete={handleDeleteShop}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// --- Shop Card Component ---
const ShopCard = ({ shop, index, onEdit, onDelete }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group"
    >
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {shop.name}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {shop.category || 'General'}
                        </span>
                    </div>
                </div>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        align="end" 
                        className="w-48 p-2 rounded-2xl bg-slate-900 dark:bg-slate-900 border-slate-700 shadow-xl"
                    >
                        {/* Header */}
                        <div className="px-2 py-1.5 mb-1">
                            <p className="text-sm font-semibold text-white">Shop</p>
                        </div>
                        <div className="h-px bg-slate-700 mb-2" />
                        
                        <DropdownMenuItem 
                            onClick={() => onEdit(shop._id)} 
                            className="rounded-xl px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-white"
                        >
                            <Settings className="mr-3 h-4 w-4 text-slate-400" />
                            Edit Shop
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => onDelete(shop._id)}
                            className="rounded-xl px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer focus:bg-slate-800 focus:text-red-300"
                        >
                            <Trash2 className="mr-3 h-4 w-4" />
                            Delete Shop
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Phone className="h-4 w-4" />
                    <span>{shop.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span>{shop.city || 'No location'}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span 
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        shop.status === 'active' || !shop.status
                            ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${shop.status === 'active' || !shop.status ? 'bg-green-500' : 'bg-slate-400'}`} />
                    {shop.status || 'active'}
                </span>
                <Button 
                    size="sm" 
                    onClick={() => onEdit(shop._id)}
                    className="rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
            </div>
        </div>
    </motion.div>
);

// --- Empty State Component ---
const EmptyState = ({ onAdd, isSearch }) => (
    <motion.div 
        variants={itemVariants}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
    >
        <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                <Store className="h-12 w-12 text-slate-400" />
            </div>
            <p className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {isSearch ? "No shops found" : "No shops yet"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {isSearch ? "Try a different search term" : "Create your first shop to get started"}
            </p>
            {!isSearch && (
                <Button onClick={onAdd} className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                    <Plus className="mr-2 h-4 w-4" /> Add Your First Shop
                </Button>
            )}
        </div>
    </motion.div>
);

export default MyShopsPage;
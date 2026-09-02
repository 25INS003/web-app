"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useShopStore } from "@/store/shopStore";
import { toast } from "sonner";
import {
    Store,
    Plus,
    Trash2,
    MoreHorizontal,
    Loader2,
    MapPin,
    Phone,
    CheckCircle,
    XCircle,
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
    const { 
        myShops, 
        fetchMyShops, 
        isLoading, 
        deactivateExistingShop,
        activateExistingShop,
        permanentlyDeleteShop,
        error: storeError 
    } = useShopStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => {
        fetchMyShops();
    }, [fetchMyShops]);

    const handleEditShop = (shopId) => {
        router.push(`/myshop/edit/${shopId}`);
    };

    const handleDeactivate = async (shopId) => {
        if (!window.confirm("Are you sure you want to deactivate this shop? It will be marked as inactive.")) return;
        
        const result = await deactivateExistingShop(shopId);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const handleActivate = async (shopId) => {
        if (!window.confirm("Are you sure you want to activate this shop?")) return;
        
        const result = await activateExistingShop(shopId);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const handleHardDelete = async (shopId) => {
        if (!window.confirm("⚠️ WARNING: This will PERMANENTLY delete the shop and ALL its data (products, orders, etc). This cannot be undone. Are you sure?")) return;
        
        const result = await permanentlyDeleteShop(shopId);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
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

    // `shop_status` defaults to 'pending', so a missing value means not-yet-
    // approved. The old `|| !s.shop_status` counted exactly that case as
    // active — backwards, and it would have shown a pending shop as live.
    const activeShops = myShops?.filter(s => s.shop_status === 'active').length || 0;
    const totalProducts = myShops?.reduce((sum, s) => sum + (s.total_products || 0), 0) || 0;
    const totalOrders = myShops?.reduce((sum, s) => sum + (s.total_orders || 0), 0) || 0;

    const stats = [
        { title: "Total Shops", value: myShops?.length || 0, icon: Store, tone: "bg-primary text-primary-foreground" },
        { title: "Active Shops", value: activeShops, icon: CheckCircle, tone: "bg-success text-success-foreground" },
        { title: "Total Products", value: totalProducts, icon: Package, tone: "bg-accent text-accent-foreground" },
        { title: "Total Orders", value: totalOrders, icon: ShoppingBag, tone: "bg-warning text-warning-foreground" }
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
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-foreground">
                        <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/25">
                            <Store className="h-6 w-6 text-primary-foreground" />
                        </div>
                        My Shops
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage all your shops in one place
                    </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                        onClick={() => router.push("/myshop/add")}
                        className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 px-5 py-2.5"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Shop
                    </Button>
                </motion.div>
            </motion.div>

            {storeError && (
                <motion.div 
                    variants={itemVariants}
                    className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl"
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
                        className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {stat.title}
                                </p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.tone} shadow-lg`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search Bar */}
            <motion.div 
                variants={itemVariants}
                className={`flex items-center rounded-2xl px-5 py-4 transition-all duration-300 border-2 bg-white dark:bg-muted/60 ${
                    searchFocused 
                        ? 'border-primary shadow-lg shadow-primary/10' 
                        : 'border-border'
                }`}
            >
                <Search className={`transition-colors ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} size={20} />
                <input
                    type="text"
                    placeholder="Search shops by name, category, or city..."
                    className="ml-3 w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
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
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </motion.div>
            ) : filteredShops.length === 0 ? (
                <EmptyState onAdd={() => router.push("/myshop/add")} isSearch={!!searchTerm} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredShops.map((shop, index) => (
                        <ShopCard
                            key={shop.id}
                            shop={shop}
                            index={index}
                            onEdit={handleEditShop}
                            onDeactivate={handleDeactivate}
                            onActivate={handleActivate}
                            onHardDelete={handleHardDelete}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// --- Shop Card Component ---
const ShopCard = ({ shop, index, onEdit, onDeactivate, onActivate, onHardDelete }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm group"
    >
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                        <Store className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-foreground">
                            {shop.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            {shop.category || 'General'}
                        </span>
                    </div>
                </div>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        align="end" 
                        className="w-48 p-2 rounded-2xl bg-card dark:bg-card border-border shadow-xl"
                    >
                        {/* Header */}
                        <div className="px-2 py-1.5 mb-1">
                            <p className="text-sm font-semibold text-foreground">Shop</p>
                        </div>
                        <div className="h-px bg-border mb-2" />
                        
                        <DropdownMenuItem 
                            onClick={() => onEdit(shop.id)} 
                            className="rounded-xl px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer focus:bg-muted focus:text-foreground"
                        >
                            <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                            Edit Shop
                        </DropdownMenuItem>
                        
                        {/* Active Shop Actions */}
                        {(shop.shop_status === 'active' || !shop.shop_status) && (
                            <DropdownMenuItem 
                                onClick={() => onDeactivate(shop.id)}
                                className="rounded-xl px-3 py-2.5 text-warning hover:text-warning hover:bg-muted cursor-pointer focus:bg-muted focus:text-warning"
                            >
                                <XCircle className="mr-3 h-4 w-4" />
                                Deactivate Shop
                            </DropdownMenuItem>
                        )}

                        {/* Inactive Shop Actions */}
                        {shop.shop_status === 'inactive' && (
                            <>
                                <DropdownMenuItem 
                                    onClick={() => onActivate(shop.id)}
                                    className="rounded-xl px-3 py-2.5 text-success hover:text-success hover:bg-muted cursor-pointer focus:bg-muted focus:text-success"
                                >
                                    <CheckCircle className="mr-3 h-4 w-4" />
                                    Activate Shop
                                </DropdownMenuItem>
                                
                                <div className="h-px bg-border my-1" />
                                
                                <DropdownMenuItem 
                                    onClick={() => onHardDelete(shop.id)}
                                    className="rounded-xl px-3 py-2.5 text-destructive hover:text-destructive hover:bg-muted cursor-pointer focus:bg-muted focus:text-destructive"
                                >
                                    <Trash2 className="mr-3 h-4 w-4" />
                                    Delete Permanently
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{shop.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{shop.city || 'No location'}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
                <span 
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        shop.shop_status === 'active' || !shop.shop_status
                            ? 'bg-success/15 text-success' 
                            : shop.shop_status === 'inactive' ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${shop.shop_status === 'active' || !shop.shop_status ? 'bg-success' : shop.shop_status === 'inactive' ? 'bg-destructive' : 'bg-muted-foreground'}`} />
                    {shop.shop_status || 'active'}
                </span>
                <Button 
                    size="sm" 
                    onClick={() => onEdit(shop.id)}
                    className="rounded-lg bg-muted text-muted-foreground hover:bg-accent"
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
        className="rounded-2xl border border-border bg-card"
    >
        <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-muted mb-4">
                <Store className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">
                {isSearch ? "No shops found" : "No shops yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
                {isSearch ? "Try a different search term" : "Create your first shop to get started"}
            </p>
            {!isSearch && (
                <Button onClick={onAdd} className="rounded-xl bg-primary">
                    <Plus className="mr-2 h-4 w-4" /> Add Your First Shop
                </Button>
            )}
        </div>
    </motion.div>
);

export default MyShopsPage;
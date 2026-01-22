"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useProductStore } from "@/store/productStore";
import { useShopStore } from "@/store/shopStore";
import GlobalSelectShop from "@/components/Dropdowns/selectShop0";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import {
    Plus,
    Search,
    Trash2,
    Edit,
    MoreHorizontal,
    Loader2,
    ImageIcon,
    Eye,
    Filter,
    RefreshCcw,
    Archive,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Package,
    Store,
    Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: "spring", stiffness: 100, damping: 15 }
    },
    exit: {
        opacity: 0,
        x: 20,
        transition: { duration: 0.2 }
    }
};

const ProductsListPage = () => {
    const { currentShop } = useShopStore();
    const shopId = currentShop?._id ?? null;

    const {
        products,
        pagination,
        isLoading,
        setFilters,
        deleteProduct,
        softDeleteProduct,
        currentShopId,
        queryParams
    } = useProductStore();

    const [tempFilters, setTempFilters] = useState({
        search: "",
        is_available: "true",
        is_active: "true",
        inStock: "all",
        sortBy: "created_at"
    });

    useEffect(() => {
        if (!shopId) return;

        // OPTIMIZATION: If we already have data for this shop, sync local filters with store and SKIP fetch.
        if (currentShopId === shopId && products.length > 0) {
            setTempFilters({
                search: queryParams.search || "",
                is_available: queryParams.is_available || "true",
                is_active: queryParams.is_active || "true",
                inStock: queryParams.inStock === undefined ? "all" : queryParams.inStock,
                sortBy: queryParams.sortBy || "created_at"
            });
            return; 
        }

        // Otherwise, fetch fresh data
        const initialFilters = {
            search: "",
            is_available: "true",
            is_active: "true",
            inStock: "all",
            sortBy: "created_at",
            page: 1
        };
        setTempFilters(initialFilters);
        setFilters(initialFilters, shopId);
    }, [shopId, currentShopId, products.length, setFilters, queryParams.search, queryParams.is_available, queryParams.is_active, queryParams.inStock, queryParams.sortBy]);

    const handleApplyFilters = () => {
        setFilters({
            ...tempFilters,
            inStock: tempFilters.inStock === "all" ? undefined : tempFilters.inStock,
            page: 1
        }, shopId);
        toast.success("Filters applied");
    };

    const handleResetFilters = () => {
        const reset = {
            search: "",
            is_available: "true",
            is_active: "true",
            inStock: "all",
            sortBy: "created_at"
        };
        setTempFilters(reset);
        setFilters({ ...reset, page: 1 }, shopId);
        toast.info("Filters reset");
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > (pagination?.totalPages || 1)) return;
        setFilters({
            ...tempFilters,
            inStock: tempFilters.inStock === "all" ? undefined : tempFilters.inStock,
            page: newPage
        }, shopId);
    };

    const handleSoftDelete = async (productId, currentStatus) => {
        if (!shopId) return;
        const action = currentStatus ? "Deactivate" : "Activate";
        const ok = await softDeleteProduct(shopId, productId);
        if (ok) toast.success(`Product ${action}d successfully`);
        else toast.error(`Failed to ${action} product`);
    };

    const handleHardDelete = async (productId) => {
        if (!shopId) return;
        if (!window.confirm("PERMANENTLY delete this product?")) return;
        const ok = await deleteProduct(shopId, productId);
        ok ? toast.success("Deleted") : toast.error("Failed");
    };

    // No Shop Selected State
    if (!shopId) {
        return (
            <motion.div 
                className="flex-1 flex items-center justify-center min-h-[70vh]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <Card className="p-8 w-full max-w-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 shadow-xl">
                    <div className="text-center space-y-6">
                        <motion.div 
                            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
                            initial={{ rotate: -10 }}
                            animate={{ rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                        >
                            <Package className="w-10 h-10 text-white" />
                        </motion.div>
                        
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Product Management
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Select a shop to manage your products
                            </p>
                        </div>
                        
                        <div className="pt-2">
                            <GlobalSelectShop ShowLabel={false} />
                        </div>
                    </div>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div 
            className="min-h-screen p-4 md:p-6 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        Products
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">{currentShop?.name}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span>{pagination?.totalProducts || 0} items</span>
                    </p>
                </div>
                
                <div className="flex gap-3 items-center">
                    <GlobalSelectShop />
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link 
                            href={`/products/${shopId}/add`} 
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 transition-all"
                        >
                            <Plus className="h-4 w-4" /> Add Product
                        </Link>
                    </motion.div>
                </div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div variants={itemVariants}>
                <Card className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search products..."
                                value={tempFilters.search}
                                onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
                                className="pl-9 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        <Select value={tempFilters.is_active} onValueChange={(v) => setTempFilters({ ...tempFilters, is_active: v })}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">All Statuses</SelectItem>
                                <SelectItem value="true">Active Only</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={tempFilters.inStock} onValueChange={(v) => setTempFilters({ ...tempFilters, inStock: v })}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Stock" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stock</SelectItem>
                                <SelectItem value="true">In Stock</SelectItem>
                                <SelectItem value="false">Out of Stock</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={tempFilters.sortBy} onValueChange={(v) => setTempFilters({ ...tempFilters, sortBy: v })}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created_at">Newest</SelectItem>
                                <SelectItem value="price">Price</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                            <Button 
                                onClick={handleApplyFilters} 
                                className="flex-1 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800"
                            >
                                <Filter className="h-4 w-4 mr-2" /> Apply
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={handleResetFilters}
                                className="rounded-xl"
                            >
                                <RefreshCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Table Section */}
            <motion.div 
                variants={itemVariants}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-lg"
            >
                <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                        <TableRow className="border-slate-200 dark:border-slate-700">
                            <TableHead className="w-[80px] font-semibold">Image</TableHead>
                            <TableHead className="font-semibold">Product</TableHead>
                            <TableHead className="font-semibold">Category</TableHead>
                            <TableHead className="font-semibold">Price</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                        <span className="text-slate-500">Loading products...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <Package className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-slate-900 dark:text-white font-medium">No products found</p>
                                            <p className="text-sm text-slate-500">Try adjusting your filters or add a new product</p>
                                        </div>
                                        <Link href={`/products/${shopId}/add`}>
                                            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-500">
                                                <Plus className="h-4 w-4 mr-2" /> Add Product
                                            </Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((p, index) => {
                                    const isActive = p.is_active;
                                    const hasValidImage = p.main_image?.url && p.main_image.url.trim() !== '';
                                    return (
                                        <TableRow
                                            key={p._id}
                                            className={`border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${!isActive ? "bg-slate-50/60 dark:bg-slate-900/60 opacity-75" : ""}`}
                                        >
                                            <TableCell>
                                                <Link href={`/products/${shopId}/view/${p._id}`} className="block">
                                                    <div 
                                                        className="h-12 w-12 relative rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-indigo-500/50 transition-all shadow-sm"
                                                    >
                                                        {hasValidImage ? (
                                                            <Image
                                                                src={p.main_image.url}
                                                                alt="product"
                                                                fill
                                                                sizes="150px"
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <ImageIcon className="h-5 w-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/products/${shopId}/view/${p._id}`} className="block group">
                                                    <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {p.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        {p.brand} {p.unit ? `• ${p.unit}` : ''}
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="rounded-lg font-medium">
                                                    {p.category_id?.name || "N/A"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                    ₹{p.price?.toLocaleString()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    className={`rounded-lg font-medium ${
                                                        p.is_in_stock 
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                                                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
                                                    }`}
                                                >
                                                    {p.is_in_stock ? "In Stock" : "Out of Stock"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200 dark:border-slate-700">
                                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                                            <Link href={`/products/${shopId}/view/${p._id}`} className="flex items-center gap-2">
                                                                <Eye className="h-4 w-4 text-indigo-500" />
                                                                <span>View Details</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                                            <Link href={`/products/${shopId}/edit/${p._id}`} className="flex items-center gap-2">
                                                                <Edit className="h-4 w-4 text-blue-500" />
                                                                <span>Edit Product</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => handleSoftDelete(p._id, isActive)}
                                                            className="rounded-lg cursor-pointer"
                                                        >
                                                            {isActive ? (
                                                                <>
                                                                    <Archive className="h-4 w-4 mr-2 text-amber-500" />
                                                                    <span>Deactivate</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                                                                    <span>Activate</span>
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        {!isActive && (
                                                            <DropdownMenuItem 
                                                                onClick={() => handleHardDelete(p._id)} 
                                                                className="rounded-lg cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                <span>Delete Permanently</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {!isLoading && products.length > 0 && pagination && (
                    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 flex items-center justify-between">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Page <span className="font-semibold text-slate-900 dark:text-white">{pagination.currentPage}</span> of{" "}
                            <span className="font-semibold text-slate-900 dark:text-white">{pagination.totalPages}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage <= 1}
                                onClick={() => handlePageChange(1)}
                                className="hidden sm:flex rounded-xl"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.hasPrev}
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                className="rounded-xl"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.hasNext}
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                className="rounded-xl"
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage >= pagination.totalPages}
                                onClick={() => handlePageChange(pagination.totalPages)}
                                className="hidden sm:flex rounded-xl"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default ProductsListPage;
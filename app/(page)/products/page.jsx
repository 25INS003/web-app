"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useProductStore } from "@/store/productStore";
import { useShopStore } from "@/store/shopStore";
import GlobalSelectShop from "@/components/Dropdowns/selectShop0";
import { Card } from "@/components/ui/card";
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
    X,
    Filter,
    RefreshCcw
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
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ProductsListPage = () => {
    const { currentShop } = useShopStore();
    const shopId = currentShop?._id ?? null;

    const {
        products,
        pagination,
        isLoading,
        setFilters,
        deleteProduct,
        queryParams,
    } = useProductStore();

    // --- Local State for "Staged" Filters ---
    const [tempFilters, setTempFilters] = useState({
        search: "",
        is_available: "true",
        inStock: "all",
        sortBy: "created_at"
    });

    // Sync temp state with store on initial load or shop change
    useEffect(() => {
        if (!shopId) return;

        const initialFilters = {
            search: "",
            is_available: "true",
            inStock: "all",
            sortBy: "created_at",
            page: 1
        };

        setTempFilters(initialFilters);
        setFilters(initialFilters, shopId);
    }, [shopId, setFilters]);

    // --- Filter Handlers ---
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
            inStock: "all",
            sortBy: "created_at"
        };
        setTempFilters(reset);
        setFilters({ ...reset, page: 1 }, shopId);
    };

    const handleDelete = async (productId) => {
        if (!shopId) return;
        if (!window.confirm("Delete this product?")) return;

        const ok = await deleteProduct(shopId, productId);
        ok ? toast.success("Product deleted") : toast.error("Delete failed");
    };

    if (!shopId) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh] bg-slate-950">
                <Card className="p-6 w-full max-w-md bg-slate-900 border-slate-800 text-slate-100">
                    <h2 className="text-xl font-semibold mb-2">Product Management</h2>
                    <p className="text-sm text-slate-400 mb-4">
                        Select a shop to manage products
                    </p>
                    <GlobalSelectShop ShowLabel={false} />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
            {/* -------------------------------- Header -------------------------------- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Products</h1>
                    <p className="text-sm text-slate-400">
                        Managing <span className="text-indigo-400 font-medium">{pagination.totalProducts}</span> items in <span className="text-slate-200">{currentShop?.name}</span>
                    </p>
                </div>

                <Link
                    href={`products/${shopId}/add`}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="h-4 w-4" />
                    Add Product
                </Link>
            </div>

            {/* -------------------------------- Filter Bar -------------------------------- */}
            <Card className="p-4 bg-slate-900 border-slate-800 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search name, SKU..."
                            value={tempFilters.search}
                            onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
                            className="pl-9 bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Availability */}
                    <Select
                        value={tempFilters.is_available}
                        onValueChange={(v) => setTempFilters({ ...tempFilters, is_available: v })}
                    >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                            <SelectItem value="none">All Statuses</SelectItem>
                            <SelectItem value="true">Available</SelectItem>
                            <SelectItem value="false">Hidden</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Stock */}
                    <Select
                        value={tempFilters.inStock}
                        onValueChange={(v) => setTempFilters({ ...tempFilters, inStock: v })}
                    >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                            <SelectValue placeholder="Stock Level" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                            <SelectItem value="all">All Stock</SelectItem>
                            <SelectItem value="true">In Stock</SelectItem>
                            <SelectItem value="false">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select
                        value={tempFilters.sortBy}
                        onValueChange={(v) => setTempFilters({ ...tempFilters, sortBy: v })}
                    >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                            <SelectItem value="created_at">Newest First</SelectItem>
                            <SelectItem value="price">Price</SelectItem>
                            <SelectItem value="name">Alphabetical</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleApplyFilters}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border-none"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleResetFilters}
                            className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        >
                            <RefreshCcw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* -------------------------------- Table -------------------------------- */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
                <Table>
                    <TableHeader className="bg-slate-800/50">
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead className="text-slate-400">Preview</TableHead>
                            <TableHead className="text-slate-400">Product Details</TableHead>
                            <TableHead className="text-slate-400">Category</TableHead>
                            <TableHead className="text-slate-400">Price</TableHead>
                            <TableHead className="text-slate-400">Stock</TableHead>
                            <TableHead className="text-right text-slate-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin inline text-indigo-500" />
                                    <p className="mt-2 text-slate-500">Fetching products...</p>
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20 text-slate-500">
                                    No products matching your criteria
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((p) => (
                                <TableRow key={p._id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                    <TableCell>
                                        <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                                            {p.images?.length ? (
                                                <img
                                                    src={p.images[0].url || p.images[0]}
                                                    className="h-full w-full object-cover"
                                                    alt={p.name}
                                                />
                                            ) : (
                                                <ImageIcon className="h-5 w-5 text-slate-600" />
                                            )}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="font-semibold text-slate-200">{p.name}</div>
                                        <div className="text-xs font-mono text-slate-500 uppercase">
                                            {p.sku || "No SKU"}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-slate-300">
                                        <Badge variant="outline" className="border-slate-700 text-slate-400">
                                            {p.category_id?.name ?? "General"}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="font-medium text-slate-200">
                                        ₹{p.price.toLocaleString()}
                                    </TableCell>

                                    <TableCell>
                                        <Badge
                                            className={
                                                p.stock_quantity > 0
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                            }
                                        >
                                            {p.stock_quantity > 0
                                                ? `${p.stock_quantity} in stock`
                                                : "Out of stock"}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="hover:bg-slate-700 text-slate-400">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-200">
                                                <DropdownMenuItem className="focus:bg-slate-700 cursor-pointer" asChild>
                                                    <Link href={`/products/${shopId}/view/${p._id}`}>
                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="focus:bg-slate-700 cursor-pointer" asChild>
                                                    <Link href={`/products/${shopId}/inventory/${p._id}`}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Product
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-rose-400 focus:bg-rose-500/10 cursor-pointer"
                                                    onClick={() => handleDelete(p._id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default ProductsListPage;
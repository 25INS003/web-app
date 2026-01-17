"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useProductStore } from "@/store/productStore";
import { useShopStore } from "@/store/shopStore";
import GlobalSelectShop from "@/components/Dropdowns/selectShop0";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";


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
    ChevronsRight
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
    DropdownMenuLabel
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
        pagination, // This contains { currentPage, totalPages, totalProducts, hasNext, hasPrev }
        isLoading,
        setFilters,
        deleteProduct,
        softDeleteProduct
    } = useProductStore();

    // Local state for filters before applying
    const [tempFilters, setTempFilters] = useState({
        search: "",
        is_available: "true",
        is_active: "true",
        inStock: "all",
        sortBy: "created_at"
    });

    // Initial Load
    useEffect(() => {
        if (!shopId) return;
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
    }, [shopId, setFilters]);

    // Apply Filter Button
    const handleApplyFilters = () => {
        setFilters({
            ...tempFilters,
            inStock: tempFilters.inStock === "all" ? undefined : tempFilters.inStock,
            page: 1 // Reset to page 1 on new filter
        }, shopId);
        toast.success("Filters applied");
    };

    // Reset Filter Button
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

    // Pagination Handler
    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > (pagination?.totalPages || 1)) return;

        // We use the CURRENT applied filters (not tempFilters) + new page
        // But since store stores the active filters, we usually just need to call setFilters with the page update.
        // Assuming setFilters merges with existing state or we pass full object.
        // Safer approach: Pass current tempFilters + new page (if user hasn't changed temp without applying)
        // OR better: Just update the page in the store if your store supports it, otherwise:
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

    if (!shopId) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Card className="p-6 w-full max-w-md bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Product Management</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Select a shop to manage products
                    </p>
                    <GlobalSelectShop ShowLabel={false} />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 space-y-6 bg-slate-50/50 dark:bg-transparent">
            {/* ... Header ... */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Products</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Total items: <span className="font-medium text-indigo-600">{pagination?.totalProducts || 0}</span>
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <GlobalSelectShop />
                    <Link href={`products/${shopId}/add`} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20">
                        <Plus className="h-4 w-4" /> Add
                    </Link>
                </div>
            </div>

            {/* ... Filter Bar ... */}
            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="relative md:col-span-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search..."
                            value={tempFilters.search}
                            onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
                            className="pl-9"
                        />
                    </div>

                    <Select value={tempFilters.is_active} onValueChange={(v) => setTempFilters({ ...tempFilters, is_active: v })}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">All Statuses</SelectItem>
                            <SelectItem value="true">Active Only</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={tempFilters.inStock} onValueChange={(v) => setTempFilters({ ...tempFilters, inStock: v })}>
                        <SelectTrigger><SelectValue placeholder="Stock" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stock</SelectItem>
                            <SelectItem value="true">In Stock</SelectItem>
                            <SelectItem value="false">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={tempFilters.sortBy} onValueChange={(v) => setTempFilters({ ...tempFilters, sortBy: v })}>
                        <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_at">Newest</SelectItem>
                            <SelectItem value="price">Price</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                        <Button onClick={handleApplyFilters} className="flex-1 bg-slate-800 text-white"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                        <Button variant="outline" onClick={handleResetFilters}><RefreshCcw className="h-4 w-4" /></Button>
                    </div>
                </div>
            </Card>

            {/* ... Table Section ... */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin inline mr-2" />Loading...</TableCell></TableRow>
                        ) : products.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500">No products found.</TableCell></TableRow>
                        ) : (
                            products.map((p) => {
                                const isActive = p.is_active;
                                return (
                                    <TableRow key={p._id} className={!isActive ? "bg-slate-50/60 opacity-75" : ""}>
                                        <TableCell >
                                            <div className="h-10 w-10 relative rounded bg-slate-100 flex items-center justify-center overflow-hidden">
                                                {p.main_image?.url ? <Image
                                                    src={p.main_image.url}
                                                    alt="product image"
                                                    fill
                                                    sizes="150px"
                                                    className="object-cover"
                                                /> : <ImageIcon className="h-4 w-4 text-slate-400" />}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{p.name}</div>
                                            <div className="text-xs text-slate-500">{p.brand} {p.unit ? `• ${p.unit}` : ''}</div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{p.category_id?.name || "N/A"}</Badge></TableCell>
                                        <TableCell>₹{p.price?.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={p.is_in_stock ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}>
                                                {p.is_in_stock ? "In Stock" : "Out of Stock"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild><Link href={`/products/${shopId}/view/${p._id}`}><Eye className="mr-2 h-4 w-4" /> View</Link></DropdownMenuItem>
                                                    <DropdownMenuItem asChild><Link href={`/products/${shopId}/edit/${p._id}`}><Edit className="mr-2 h-4 w-4" /> Edit</Link></DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSoftDelete(p._id, isActive)}
                                                            className="flex w-full items-center"
                                                        >
                                                            {isActive ? (
                                                                <>
                                                                    <Archive className="mr-2 h-4 w-4 text-orange-500" />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                                                                    Activate
                                                                </>
                                                            )}
                                                        </button>
                                                    </DropdownMenuItem>



                                                    {!isActive ? <DropdownMenuItem onClick={() => handleHardDelete(p._id)} className="text-rose-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem> : null}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {/* --- PAGINATION CONTROLS --- */}
                {!isLoading && products.length > 0 && pagination && (
                    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 flex items-center justify-between">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Showing page <span className="font-medium">{pagination.currentPage}</span> of <span className="font-medium">{pagination.totalPages}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage <= 1}
                                onClick={() => handlePageChange(1)}
                                className="hidden sm:flex"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.hasPrev}
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.hasNext}
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage >= pagination.totalPages}
                                onClick={() => handlePageChange(pagination.totalPages)}
                                className="hidden sm:flex"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsListPage;
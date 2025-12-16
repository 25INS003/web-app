"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useProductStore } from "@/store/productStore";
import GlobalSelectShop from "@/components/Dropdowns/selectShop0";
import { Card } from "@/components/ui/card";
import { useShopStore } from "@/store/shopStore";
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
    X, // Import X for clearing search
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

/* =========================================
   Create Product Dialog
========================================= */
const CreateProductDialog = ({ shopId, open, onOpenChange }) => {
    const { createProduct, isLoading } = useProductStore();
    const { register, handleSubmit, reset } = useForm();

    const onSubmit = async (data) => {
        if (!shopId) {
            toast.error("Please select a shop first.");
            return;
        }

        const payload = {
            ...data,
            price: Number(data.price),
            stock_quantity: Number(data.stock_quantity),
            shop_id: shopId,
            unit: data.unit || 'piece',
        };

        const success = await createProduct(shopId, payload);
        if (success) {
            reset();
            onOpenChange(false);
            toast.success("Product created successfully!");
        } else {
            toast.error("Failed to create product.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-slate-900 dark:text-slate-100">Add New Product</DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        Add a new item to your inventory.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <Input
                        {...register("name", { required: true })}
                        placeholder="Product Name"
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                    <Input
                        type="number"
                        {...register("price", { required: true })}
                        placeholder="Price (₹)"
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                    <Input
                        type="number"
                        {...register("stock_quantity", { required: true })}
                        placeholder="Stock Quantity"
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />

                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="bg-white dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

/* =========================================
   Products List Page (UPDATED)
========================================= */
const ProductsListPage = () => {
    const { currentShop } = useShopStore();
    const shopId = currentShop?._id ?? null;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const {
        products = [],
        pagination,
        isLoading,
        fetchShopProducts,
        setFilters,
        setPage, // Not strictly needed for search as setFilters resets page, but good for pagination UI
        deleteProduct,
        queryParams,
    } = useProductStore();

    /* 1. Initial Load & Shop Change Reset */
    useEffect(() => {
        if (!shopId) return;

        // Reset local and store state when shop changes
        setSearchTerm("");
        setFilters({ search: "" });
        fetchShopProducts(shopId);
    }, [shopId, fetchShopProducts, setFilters]);

    /* 2. Search Handler (UPDATED) */
    const handleSearch = (e) => {
        e.preventDefault(); // Prevent page reload

        // Update the store with the search term
        setFilters({ search: searchTerm }, shopId);
        console.log("Searching for:", searchTerm);
        console.log("Current Query Params:", queryParams);

        // TRIGGER THE API CALL
        fetchShopProducts(shopId);
    };

    /* 3. Clear Search Handler (NEW) */
    const handleClearSearch = () => {
        setSearchTerm("");
        setFilters({ search: "" });
        fetchShopProducts(shopId);
    };

    /* Delete Handler */
    const handleDelete = async (productId) => {
        if (!shopId) return;
        if (window.confirm("Are you sure you want to delete this product?")) {
            const success = await deleteProduct(shopId, productId);
            if (success) {
                toast.success("Product deleted successfully.");
            } else {
                toast.error("Failed to delete product.");
            }
        }
    };

    if (!shopId) {
        return (
            <div className="flex-1 w-full flex items-center justify-center p-4 min-h-[50vh]">
                <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Product Management</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Please select a shop to manage inventory.
                        </p>
                    </div>
                    <GlobalSelectShop ShowLabel={false} />
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Products</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Managing <span className="font-semibold text-slate-700 dark:text-slate-300">{currentShop?.name}</span> • {pagination?.totalProducts ?? 0} items found
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="w-full sm:w-[200px]">
                        <GlobalSelectShop />
                    </div>

                    <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Search Bar (UPDATED UI) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name, SKU, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Button type="submit" variant="secondary" className="bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                        Search
                    </Button>
                </form>
            </div>

            {/* Table */}
            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                        <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                            <TableHead className="w-[80px] text-slate-700 dark:text-slate-300">Image</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300">Name</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300">Category</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300">Price</TableHead>
                            <TableHead className="text-slate-700 dark:text-slate-300">Stock</TableHead>
                            <TableHead className="text-right text-slate-700 dark:text-slate-300">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-center text-slate-500 dark:text-slate-400">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        Loading products...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                    {searchTerm ? `No results found for "${searchTerm}"` : "No products found. Add one to get started!"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product._id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <TableCell>
                                        {product.images?.length ? (
                                            <img src={product.images[0].url || product.images[0]} alt={product.name} className="h-10 w-10 rounded-md object-cover border border-slate-200 dark:border-slate-700" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                <ImageIcon className="h-5 w-5 text-slate-400" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                        {product.name}
                                        <div className="text-xs text-slate-500 dark:text-slate-500 font-mono mt-0.5">{product.sku}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900">
                                            {typeof product.category_id === 'object' ? product.category_id?.name : "General"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900 dark:text-slate-200">
                                        ₹{product.price}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                product.stock_quantity > 10
                                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                                                    : product.stock_quantity > 0
                                                        ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                                        : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                            }
                                        >
                                            {product.stock_quantity > 0
                                                ? `${product.stock_quantity} ${product.unit || 'units'}`
                                                : "Out of Stock"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <MoreHorizontal className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-40">
                                                <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">
                                                    <Link href={`/products/${shopId}/view/${product._id}`} className="w-full flex items-center text-slate-700 dark:text-slate-200">
                                                        <Eye className="mr-2 h-4 w-4" /> View
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">
                                                    <Link href={`/products/${shopId}/inventory/${product._id}`} className="w-full flex items-center text-slate-700 dark:text-slate-200">
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Stock
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700"
                                                    onClick={() => handleDelete(product._id)}
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

            <CreateProductDialog
                shopId={shopId}
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />
        </div>
    );
};

export default ProductsListPage;
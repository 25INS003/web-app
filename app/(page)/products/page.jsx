"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useProductStore } from "@/store/productStore"; // Adjust path
import SelectShop from "@/components/Dropdowns/selectShop";

// --- Icons (Lucide React) ---
import {
    Plus,
    Search,
    Trash2,
    Edit,
    MoreHorizontal,
    Loader2,
    ImageIcon
} from "lucide-react";

// --- Shadcn UI Components ---
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

// ==========================================
// Sub-Component: Create Product Modal
// ==========================================
const CreateProductDialog = ({ shopId, open, onOpenChange }) => {
    const { createProduct, isLoading } = useProductStore();
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        const payload = {
            ...data,
            price: Number(data.price),
            stock_quantity: Number(data.stock_quantity),
            shop_id: shopId,
            // Note: You would typically add a Category Selector here
        };

        const success = await createProduct(shopId, payload);
        if (success) {
            reset();
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-slate-100">Add New Product</DialogTitle>
                    <DialogDescription className="dark:text-slate-400">Add a new item to your inventory.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium dark:text-slate-300">Name</label>
                            <Input
                                {...register("name", { required: "Name is required" })}
                                placeholder="Product Name"
                                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                            />
                            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium dark:text-slate-300">Unit</label>
                            <select
                                {...register("unit", { required: true })}
                                // DARK THEME FIX for select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                            >
                                <option value="piece">Piece</option>
                                <option value="kg">Kg</option>
                                <option value="gram">Gram</option>
                                <option value="liter">Liter</option>
                                <option value="set">Set</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium dark:text-slate-300">Price</label>
                            <Input
                                type="number"
                                {...register("price", { required: true, min: 0 })}
                                placeholder="0.00"
                                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium dark:text-slate-300">Stock</label>
                            <Input
                                type="number"
                                {...register("stock_quantity", { required: true, min: 0 })}
                                placeholder="0"
                                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        {/* DARK THEME FIX for outline Button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-100"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// ==========================================
// Main Page Component
// ==========================================
const ProductsListPage = () => {
    // Local State
    const [selectedShop, setSelectedShop] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Store State
    const {
        products,
        pagination,
        isLoading,
        fetchShopProducts,
        setFilters,
        setPage,
        deleteProduct
    } = useProductStore();

    // 1. Fetch products whenever shop changes
    useEffect(() => {
        if (selectedShop?._id) {
            // Reset search when switching shops
            setSearchTerm("");
            fetchShopProducts(selectedShop._id);
        }
    }, [selectedShop, fetchShopProducts]);

    // 2. Handle Search
    const handleSearch = (e) => {
        e.preventDefault();
        setFilters({ search: searchTerm });
    };

    // 3. Handle Delete
    const handleDelete = async (productId) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            await deleteProduct(selectedShop._id, productId);
        }
    };

    // 4. Render Logic - No Shop Selected
    if (!selectedShop) {
        return (
            // DARK THEME FIX for no shop selected screen
            <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh] space-y-4 dark:bg-slate-900 dark:text-slate-100">
                <h1 className="text-2xl font-bold dark:text-slate-100">Product Management</h1>
                <div className="w-full max-w-sm">
                    <SelectShop onShopSelect={setSelectedShop} />
                </div>
                <p className="text-muted-foreground dark:text-slate-400">Please select a shop to manage inventory.</p>
            </div>
        );
    }

    // 5. Render Logic - Shop Selected (Dashboard)
    return (
        // DARK THEME FIX for main content background
        <div className="container mx-auto p-6 space-y-6 dark:bg-slate-900 dark:text-slate-100 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-[200px]">
                        <SelectShop onShopSelect={setSelectedShop} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight dark:text-slate-100">Products</h1>
                        <p className="text-sm text-muted-foreground dark:text-slate-400">
                            Managing {selectedShop.name} ({pagination.totalProducts} items)
                        </p>
                    </div>
                </div>

                <Link href={`products/${selectedShop._id}/add`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            {/* DARK THEME FIX for Filters container */}
            <div className="flex items-center gap-2 bg-white p-4 rounded-lg border shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground dark:text-slate-400" />
                        <Input
                            placeholder="Search by name..."
                            className="pl-8 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* DARK THEME FIX for variant="secondary" button */}
                    <Button type="submit" variant="secondary" className="dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100">Search</Button>
                </form>
            </div>

            {/* Table */}
            {/* DARK THEME FIX for Table container */}
            <div className="rounded-md border bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <Table>
                    <TableHeader>
                        {/* DARK THEME FIX for TableRow in Header */}
                        <TableRow className="dark:hover:bg-slate-700/50">
                            <TableHead className="w-[80px] dark:text-slate-300">Image</TableHead>
                            <TableHead className="dark:text-slate-300">Name</TableHead>
                            <TableHead className="dark:text-slate-300">Category</TableHead>
                            <TableHead className="dark:text-slate-300">Price</TableHead>
                            <TableHead className="dark:text-slate-300">Stock</TableHead>
                            <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow className="dark:hover:bg-slate-700/50">
                                <TableCell colSpan={6} className="h-24 text-center dark:text-slate-300">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin" /> Loading...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow className="dark:hover:bg-slate-700/50">
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground dark:text-slate-400">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product._id} className="dark:hover:bg-slate-700/50">
                                    <TableCell>
                                        {product.images && product.images.length > 0 ? (
                                            <img src={product.images[0]} alt="" className="h-10 w-10 rounded-md object-cover border dark:border-slate-700" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center dark:bg-slate-700">
                                                <ImageIcon className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium dark:text-slate-100">
                                        <div className="flex flex-col">
                                            <span>{product.name}</span>
                                            <span className="text-xs text-muted-foreground dark:text-slate-400">{product.brand}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {/* Badge variant="outline" needs dark theme adjustment */}
                                        <Badge variant="outline" className="dark:border-slate-600 dark:text-slate-300">
                                            {product.category_id?.name || "N/A"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="dark:text-slate-100">
                                        {product.discounted_price ? (
                                            <div className="flex flex-col">
                                                <span className="font-bold text-green-600 dark:text-green-400">₹{product.discounted_price}</span>
                                                <span className="text-xs line-through text-muted-foreground dark:text-slate-500">₹{product.price}</span>
                                            </div>
                                        ) : (
                                            <span>₹{product.price}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                                            {product.stock_quantity > 0 ? `${product.stock_quantity} ${product.unit}` : "Out of Stock"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                {/* DARK THEME FIX for variant="ghost" button */}
                                                <Button variant="ghost" className="h-8 w-8 p-0 dark:hover:bg-slate-700">
                                                    <MoreHorizontal className="h-4 w-4 dark:text-slate-300" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            {/* DARK THEME FIX for DropdownMenuContent and Items */}
                                            <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                                                <DropdownMenuItem className="dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                                    <Link href={`products/${selectedShop._id}/edit/${product._id}`} className=" h-full w-full flex items-center">
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </Link>

                                                </DropdownMenuItem>
                                                {/* Ensure destructive color stands out in dark mode */}
                                                <DropdownMenuItem
                                                    className="text-red-600 dark:text-red-400 dark:hover:bg-red-900/50 dark:focus:bg-red-900/50"
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

            {/* Pagination */}
            {!isLoading && products.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground dark:text-slate-400">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* DARK THEME FIX for outline Button (Previous/Next) */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(pagination.currentPage - 1)}
                            disabled={!pagination.hasPrev}
                            className="dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-100"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(pagination.currentPage + 1)}
                            disabled={!pagination.hasNext}
                            className="dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-100"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Product Modal */}
            <CreateProductDialog
                shopId={selectedShop?._id}
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />
        </div>
    );
};

export default ProductsListPage;
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
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
    Building2,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// ==========================================
// Add Shop Dialog Component
// ==========================================
const AddShopDialog = ({ open, onOpenChange, onShopAdded }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setErrorMsg("");
        setSuccessMsg("");
        
        try {
            const response = await fetch('/api/shops', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to create shop');
            }

            const result = await response.json();
            
            setSuccessMsg("Shop created successfully!");
            setTimeout(() => {
                reset();
                onOpenChange(false);
                if (onShopAdded) onShopAdded();
            }, 1000);
        } catch (error) {
            console.error("Error creating shop:", error);
            setErrorMsg("Failed to create shop. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Create New Shop
                    </DialogTitle>
                    <DialogDescription>
                        Fill in the details to create your new shop. You can update these later.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {successMsg && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                            {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Shop Name *</label>
                        <Input
                            {...register("name", { required: "Shop name is required" })}
                            placeholder="e.g., My Electronics Store"
                        />
                        {errors.name && (
                            <span className="text-red-500 text-xs">{errors.name.message}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category *</label>
                        <select
                            {...register("category", { required: "Category is required" })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="">Select Category</option>
                            <option value="grocery">Grocery</option>
                            <option value="electronics">Electronics</option>
                            <option value="fashion">Fashion</option>
                            <option value="food">Food & Beverages</option>
                            <option value="pharmacy">Pharmacy</option>
                            <option value="books">Books & Stationery</option>
                            <option value="home">Home & Furniture</option>
                            <option value="other">Other</option>
                        </select>
                        {errors.category && (
                            <span className="text-red-500 text-xs">{errors.category.message}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            {...register("description")}
                            placeholder="Briefly describe your shop..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <Input
                                {...register("phone", {
                                    pattern: {
                                        value: /^[0-9]{10}$/,
                                        message: "Invalid phone number (10 digits)"
                                    }
                                })}
                                placeholder="1234567890"
                            />
                            {errors.phone && (
                                <span className="text-red-500 text-xs">{errors.phone.message}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                {...register("email", {
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email"
                                    }
                                })}
                                placeholder="shop@example.com"
                            />
                            {errors.email && (
                                <span className="text-red-500 text-xs">{errors.email.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Address</label>
                        <Textarea
                            {...register("address")}
                            placeholder="Street address"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">City</label>
                            <Input {...register("city")} placeholder="City" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">State</label>
                            <Input {...register("state")} placeholder="State" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pincode</label>
                            <Input
                                {...register("pincode", {
                                    pattern: {
                                        value: /^[0-9]{6}$/,
                                        message: "Invalid pincode"
                                    }
                                })}
                                placeholder="000000"
                            />
                            {errors.pincode && (
                                <span className="text-red-500 text-xs">{errors.pincode.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Opening Time</label>
                            <Input
                                type="time"
                                {...register("opening_time")}
                                defaultValue="09:00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Closing Time</label>
                            <Input
                                type="time"
                                {...register("closing_time")}
                                defaultValue="21:00"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            reset();
                            onOpenChange(false);
                        }}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Shop
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ==========================================
// Main Manage Shops Page Component
// ==========================================
const ManageShopsPage = () => {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [shops, setShops] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const fetchShops = async () => {
        setIsLoading(true);
        setErrorMsg("");
        try {
            const response = await fetch('/api/shops');
            if (!response.ok) {
                throw new Error('Failed to fetch shops');
            }
            const data = await response.json();
            setShops(data.shops || []);
        } catch (error) {
            console.error("Error fetching shops:", error);
            setErrorMsg("Failed to load shops. Please refresh the page.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const handleShopAdded = () => {
        fetchShops();
    };

    const handleDeleteShop = async (shopId) => {
        if (!window.confirm("Are you sure you want to delete this shop? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`/api/shops/${shopId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete shop');
            }

            fetchShops();
        } catch (error) {
            console.error("Error deleting shop:", error);
            alert("Failed to delete shop. Please try again.");
        }
    };

    const filteredShops = shops.filter(shop =>
        shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeShops = shops.filter(s => s.status === 'active').length;
    const totalProducts = shops.reduce((sum, s) => sum + (s.total_products || 0), 0);
    const totalOrders = shops.reduce((sum, s) => sum + (s.total_orders || 0), 0);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        Manage Shops
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage all your shops in one place
                    </p>
                </div>

                <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Shop
                </Button>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Shops</p>
                                <p className="text-3xl font-bold">{shops.length}</p>
                            </div>
                            <Store className="h-10 w-10 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Shops</p>
                                <p className="text-3xl font-bold text-green-600">{activeShops}</p>
                            </div>
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Products</p>
                                <p className="text-3xl font-bold">{totalProducts}</p>
                            </div>
                            <Building2 className="h-10 w-10 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Orders</p>
                                <p className="text-3xl font-bold">{totalOrders}</p>
                            </div>
                            <CheckCircle className="h-10 w-10 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white dark:bg-slate-800/60">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search shops by name, category, or city..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800/60">
                <CardHeader>
                    <CardTitle>Your Shops</CardTitle>
                    <CardDescription>
                        View and manage all your registered shops
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Shop Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredShops.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Store className="h-12 w-12 text-muted-foreground" />
                                            <p className="text-muted-foreground">
                                                {searchTerm ? "No shops found matching your search" : "No shops yet. Create your first shop!"}
                                            </p>
                                            {!searchTerm && (
                                                <Button onClick={() => setIsAddDialogOpen(true)} className="mt-2">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add Your First Shop
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredShops.map((shop) => (
                                    <TableRow key={shop._id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4 text-muted-foreground" />
                                                {shop.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{shop.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-start gap-1 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <div>{shop.city || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">{shop.address || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                {shop.phone || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold">{shop.total_products || 0}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={shop.status === 'active' ? 'default' : 'secondary'}
                                                className={shop.status === 'active' ? 'bg-green-500' : ''}
                                            >
                                                {shop.status === 'active' ? (
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                )}
                                                {shop.status || 'active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/myshop?shop=${shop._id}`} className="cursor-pointer">
                                                            <Settings className="mr-2 h-4 w-4" />
                                                            Manage Settings
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/products/${shop._id}`} className="cursor-pointer">
                                                            <Building2 className="mr-2 h-4 w-4" />
                                                            View Products
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600 cursor-pointer"
                                                        onClick={() => handleDeleteShop(shop._id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Shop
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AddShopDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onShopAdded={handleShopAdded}
            />
        </div>
    );
};

export default ManageShopsPage;
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
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
    Settings,
    Edit,
    Mail,
    Clock
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
// Main My Shops Page Component
// ==========================================
const MyShopsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
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

    const handleEditShop = (shopId) => {
        router.push(`/myshop/edit?shop=${shopId}`);
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
                        <Store className="h-8 w-8" />
                        My Shops
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage all your shops in one place
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

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
            ) : filteredShops.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Store className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-xl font-semibold mb-2">
                            {searchTerm ? "No shops found" : "No shops yet"}
                        </p>
                        <p className="text-muted-foreground mb-6">
                            {searchTerm ? "Try adjusting your search" : "Create your first shop to get started"}
                        </p>
                        {!searchTerm && (
                            <Button onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Your First Shop
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredShops.map((shop) => (
                        <Card key={shop._id} className="bg-white dark:bg-slate-800/60 hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {shop.image ? (
                                            <img
                                                src={shop.image}
                                                alt={shop.name}
                                                className="h-12 w-12 rounded-lg object-cover border-2 border-gray-200"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Store className="h-6 w-6 text-blue-600" />
                                            </div>
                                        )}
                                        <div>
                                            <CardTitle className="text-lg">{shop.name}</CardTitle>
                                            <Badge variant="outline" className="mt-1">
                                                {shop.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => handleEditShop(shop._id)}
                                                className="cursor-pointer"
                                            >
                                                <Settings className="mr-2 h-4 w-4" />
                                                Edit Shop
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
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {shop.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {shop.description}
                                    </p>
                                )}

                                <div className="space-y-2">
                                    {shop.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{shop.phone}</span>
                                        </div>
                                    )}
                                    {shop.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate">{shop.email}</span>
                                        </div>
                                    )}
                                    {(shop.city || shop.address) && (
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <span className="line-clamp-2">
                                                {shop.address ? `${shop.address}, ` : ''}{shop.city}
                                            </span>
                                        </div>
                                    )}
                                    {(shop.opening_time || shop.closing_time) && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {shop.opening_time || '09:00'} - {shop.closing_time || '21:00'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t">
                                    <div className="flex items-center gap-2">
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
                                        <span className="text-xs text-muted-foreground">
                                            {shop.total_products || 0} products
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleEditShop(shop._id)}
                                    >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AddShopDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onShopAdded={handleShopAdded}
            />
        </div>
    );
};

export default MyShopsPage;
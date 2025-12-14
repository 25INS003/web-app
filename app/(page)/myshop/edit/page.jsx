"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Store,
    MapPin,
    Phone,
    Mail,
    Clock,
    Save,
    Loader2,
    Building2,
    User,
    Settings,
    ImageIcon,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    Globe,
    Tag,
    FileText,
    ArrowLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EditShopPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const shopId = searchParams.get('shop');
    
    const [selectedShop, setSelectedShop] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [shopImage, setShopImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    // Fetch shop details when component mounts
    useEffect(() => {
        if (shopId) {
            fetchShopDetails(shopId);
        } else {
            router.push('/myshop');
        }
    }, [shopId]);

    useEffect(() => {
        if (selectedShop) {
            setIsLoading(true);
            
            reset({
                name: selectedShop.name || "",
                description: selectedShop.description || "",
                email: selectedShop.email || "",
                phone: selectedShop.phone || "",
                address: selectedShop.address || "",
                city: selectedShop.city || "",
                state: selectedShop.state || "",
                pincode: selectedShop.pincode || "",
                gst_number: selectedShop.gst_number || "",
                opening_time: selectedShop.opening_time || "09:00",
                closing_time: selectedShop.closing_time || "21:00",
                website: selectedShop.website || "",
                category: selectedShop.category || "",
            });
            setImagePreview(selectedShop.image || "");
            setIsLoading(false);
        }
    }, [selectedShop, reset]);

    const fetchShopDetails = async (shopId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/shops/${shopId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch shop details');
            }
            const data = await response.json();
            setSelectedShop(data.shop);
        } catch (error) {
            console.error("Error fetching shop details:", error);
            setErrorMessage("Failed to load shop details");
            setTimeout(() => router.push('/myshop'), 2000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setShopImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data) => {
        setIsSaving(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                formData.append(key, data[key]);
            });
            
            if (shopImage) {
                formData.append('image', shopImage);
            }

            const response = await fetch(`/api/shops/${selectedShop._id}`, {
                method: 'PUT',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to update shop');
            }

            const result = await response.json();
            setSelectedShop(result.shop);
            setSuccessMessage("Shop details updated successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            console.error("Error updating shop:", error);
            setErrorMessage("Failed to update shop details. Please try again.");
            setTimeout(() => setErrorMessage(""), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !selectedShop) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading shop details...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push('/myshop')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Settings className="h-6 w-6" />
                            Edit Shop: {selectedShop.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Update shop information and preferences
                        </p>
                    </div>
                </div>

                <Badge variant="outline" className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {selectedShop.status || 'Active'}
                </Badge>
            </div>

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {errorMessage}
                </div>
            )}

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-white dark:bg-slate-800/60 border">
                    <TabsTrigger value="general">
                        <Store className="h-4 w-4 mr-2" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="contact">
                        <Phone className="h-4 w-4 mr-2" />
                        Contact
                    </TabsTrigger>
                    <TabsTrigger value="business">
                        <Building2 className="h-4 w-4 mr-2" />
                        Business
                    </TabsTrigger>
                    <TabsTrigger value="hours">
                        <Clock className="h-4 w-4 mr-2" />
                        Hours
                    </TabsTrigger>
                </TabsList>

                <div className="space-y-6">
                    <TabsContent value="general" className="space-y-6">
                        <Card className="bg-white dark:bg-slate-800/60 border-border">
                            <CardHeader>
                                <CardTitle>Shop Information</CardTitle>
                                <CardDescription>
                                    Basic information about your shop
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium">Shop Image</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            {imagePreview ? (
                                                <div className="relative">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Shop"
                                                        className="h-24 w-24 rounded-lg object-cover border-2 border-gray-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setImagePreview("");
                                                            setShopImage(null);
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-24 w-24 rounded-lg bg-secondary flex items-center justify-center border-2 border-dashed border-gray-300">
                                                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                id="shop-image"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                            <label htmlFor="shop-image">
                                                <Button type="button" variant="outline" size="sm" asChild>
                                                    <span className="cursor-pointer">
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        Upload Image
                                                    </span>
                                                </Button>
                                            </label>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Recommended: 400x400px, max 2MB
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Store className="h-4 w-4" />
                                        Shop Name
                                    </label>
                                    <Input
                                        {...register("name", { required: "Shop name is required" })}
                                        placeholder="Enter shop name"
                                        disabled={isLoading}
                                    />
                                    {errors.name && (
                                        <span className="text-red-500 text-xs">{errors.name.message}</span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Description
                                    </label>
                                    <Textarea
                                        {...register("description")}
                                        placeholder="Describe your shop..."
                                        rows={4}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Category
                                    </label>
                                    <select
                                        {...register("category")}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        disabled={isLoading}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="grocery">Grocery</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="fashion">Fashion</option>
                                        <option value="food">Food & Beverages</option>
                                        <option value="pharmacy">Pharmacy</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-6">
                        <Card className="bg-white dark:bg-slate-800/60 border-border">
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                                <CardDescription>
                                    How customers can reach you
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            {...register("email", {
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: "Invalid email address"
                                                }
                                            })}
                                            placeholder="shop@example.com"
                                            disabled={isLoading}
                                        />
                                        {errors.email && (
                                            <span className="text-red-500 text-xs">{errors.email.message}</span>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            Phone
                                        </label>
                                        <Input
                                            {...register("phone", {
                                                pattern: {
                                                    value: /^[0-9]{10}$/,
                                                    message: "Invalid phone number"
                                                }
                                            })}
                                            placeholder="1234567890"
                                            disabled={isLoading}
                                        />
                                        {errors.phone && (
                                            <span className="text-red-500 text-xs">{errors.phone.message}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        Website (Optional)
                                    </label>
                                    <Input
                                        {...register("website")}
                                        placeholder="https://www.example.com"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Address
                                    </label>
                                    <Textarea
                                        {...register("address")}
                                        placeholder="Street address"
                                        rows={2}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">City</label>
                                        <Input
                                            {...register("city")}
                                            placeholder="City"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">State</label>
                                        <Input
                                            {...register("state")}
                                            placeholder="State"
                                            disabled={isLoading}
                                        />
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
                                            disabled={isLoading}
                                        />
                                        {errors.pincode && (
                                            <span className="text-red-500 text-xs">{errors.pincode.message}</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="business" className="space-y-6">
                        <Card className="bg-white dark:bg-slate-800/60 border-border">
                            <CardHeader>
                                <CardTitle>Business Details</CardTitle>
                                <CardDescription>
                                    Legal and tax information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        GST Number (Optional)
                                    </label>
                                    <Input
                                        {...register("gst_number")}
                                        placeholder="22AAAAA0000A1Z5"
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter your GST registration number if applicable
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Owner Name
                                    </label>
                                    <Input
                                        value={selectedShop.owner_name || "N/A"}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Shop ID</label>
                                    <Input
                                        value={selectedShop._id || "N/A"}
                                        disabled
                                        className="bg-gray-50 font-mono text-xs"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="hours" className="space-y-6">
                        <Card className="bg-white dark:bg-slate-800/60 border-border">
                            <CardHeader>
                                <CardTitle>Operating Hours</CardTitle>
                                <CardDescription>
                                    Set your shop's working hours
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Opening Time
                                        </label>
                                        <Input
                                            type="time"
                                            {...register("opening_time")}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Closing Time
                                        </label>
                                        <Input
                                            type="time"
                                            {...register("closing_time")}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> These hours will be displayed to customers. Make sure to update them if your schedule changes.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/myshop')}
                            disabled={isSaving || isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => reset()}
                            disabled={isSaving || isLoading}
                        >
                            Reset
                        </Button>
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSaving || isLoading}
                            className="min-w-[120px]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Tabs>

            <Card className="bg-white dark:bg-slate-800/60 border-border">
                <CardHeader>
                    <CardTitle>Shop Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Products</p>
                            <p className="text-2xl font-bold">{selectedShop.total_products || 0}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Orders</p>
                            <p className="text-2xl font-bold">{selectedShop.total_orders || 0}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Active Customers</p>
                            <p className="text-2xl font-bold">{selectedShop.active_customers || 0}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EditShopPage;
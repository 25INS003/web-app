"use client";

import React, { useEffect, useState, use } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useShopStore } from "@/store/shopStore";
import {
    Store,
    MapPin,
    Phone,
    Mail,
    Clock,
    Save,
    Loader2,
    Building2,
    ImageIcon,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    Globe,
    FileText,
    ArrowLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SelectCategory from "@/components/Dropdowns/selectCategory";

const EditShopPage = ({ params }) => {
    const { shopId } = use(params);
    const router = useRouter();

    const { myShops, fetchMyShops, updateExistingShop, isLoading: storeLoading } = useShopStore();

    const [selectedShop, setSelectedShop] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [shopImage, setShopImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

    useEffect(() => {
        if (myShops.length === 0) {
            fetchMyShops();
        }
    }, [fetchMyShops, myShops.length]);

    useEffect(() => {
        const shop = myShops.find(s => s._id === shopId);
        if (shop) {
            setSelectedShop(shop);
            reset({
                name: shop.name || "",
                description: shop.description || "",
                email: shop.email || "",
                phone: shop.phone || "",
                address: shop.address || "",
                city: shop.city || "",
                state: shop.state || "",
                pincode: shop.pincode || "",
                gst_number: shop.gst_number || "",
                opening_time: shop.opening_time || "09:00",
                closing_time: shop.closing_time || "21:00",
                website: shop.website || "",
                category: shop.category || "",
            });
            setImagePreview(shop.image || "");
        } else if (!storeLoading && myShops.length > 0) {
            setErrorMessage("Shop not found.");
            setTimeout(() => router.push('/myshop'), 2000);
        }
    }, [shopId, myShops, reset, storeLoading, router]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setShopImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data) => {
        setIsSaving(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const formData = new FormData();
            // Append all form fields to FormData
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });

            // Append image if a new one was selected
            if (shopImage) {
                formData.append('image', shopImage);
            }

            const updated = await updateExistingShop(shopId, formData);

            if (updated) {
                setSuccessMessage("Shop details updated successfully!");
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                throw new Error("Update failed");
            }
        } catch (error) {
            setErrorMessage(error.message || "Failed to update shop details.");
        } finally {
            setIsSaving(false);
        }
    };

    if (storeLoading && !selectedShop) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Fetching shop details...</p>
            </div>
        );
    }

    if (!selectedShop && !storeLoading) {
        return <div className="p-10 text-center">Shop not found.</div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-5xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/myshop')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            Edit Shop: {selectedShop.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">Manage your business profile and availability</p>
                    </div>
                </div>
                <Badge variant={selectedShop.status === 'active' ? 'default' : 'secondary'} className="px-3 py-1">
                    {selectedShop.status?.toUpperCase() || 'ACTIVE'}
                </Badge>
            </div>

            {/* Notifications */}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" /> {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 text-red-600" /> {errorMessage}
                </div>
            )}

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto bg-muted/50 p-1">
                    <TabsTrigger value="general" className="py-2"><Store className="h-4 w-4 mr-2" /> General</TabsTrigger>
                    <TabsTrigger value="contact" className="py-2"><Phone className="h-4 w-4 mr-2" /> Contact</TabsTrigger>
                    <TabsTrigger value="business" className="py-2"><Building2 className="h-4 w-4 mr-2" /> Business</TabsTrigger>
                    <TabsTrigger value="hours" className="py-2"><Clock className="h-4 w-4 mr-2" /> Hours</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="general" className="space-y-6 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Update your shop's display details and branding</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium">Shop Brand Image</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            {imagePreview ? (
                                                <div className="relative">
                                                    <img src={imagePreview} alt="Shop Preview" className="h-28 w-28 rounded-xl object-cover border-2 border-muted" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setImagePreview(""); setShopImage(null); }}
                                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-28 w-28 rounded-xl bg-muted flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20">
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <input type="file" id="shop-image" accept="image/*" onChange={handleImageChange} className="hidden" />
                                            <label htmlFor="shop-image">
                                                <Button type="button" variant="outline" size="sm" asChild>
                                                    <span className="cursor-pointer"><Upload className="h-4 w-4 mr-2" /> Change Image</span>
                                                </Button>
                                            </label>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">JPG, PNG or WEBP. Max 2MB.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Shop Name</label>
                                        <Input {...register("name", { required: "Shop name is required" })} placeholder="Enter shop name" />
                                        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description</label>
                                        <Textarea {...register("description")} rows={4} placeholder="Tell customers about your shop..." />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Category</label>
                                        <Controller
                                            name="category"
                                            control={control}
                                            render={({ field }) => (
                                                <SelectCategory
                                                    selectedCategory={field.value}
                                                    setSelectedCategory={field.onChange}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-6 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact & Location</CardTitle>
                                <CardDescription>How customers can reach you and find your store</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2"><Mail className="h-3 w-3" /> Email Address</label>
                                        <Input type="email" {...register("email")} placeholder="business@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2"><Phone className="h-3 w-3" /> Phone Number</label>
                                        <Input {...register("phone")} placeholder="+1 234 567 890" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2"><MapPin className="h-3 w-3" /> Street Address</label>
                                    <Textarea {...register("address")} rows={2} placeholder="Building, Street, Area" />
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
                                        <Input {...register("pincode")} placeholder="Zip Code" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="business" className="space-y-6 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Business Registration</CardTitle>
                                <CardDescription>Official business details and web presence</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2"><FileText className="h-3 w-3" /> GST Number / Tax ID</label>
                                    <Input {...register("gst_number")} placeholder="22AAAAA0000A1Z5" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2"><Globe className="h-3 w-3" /> Website URL</label>
                                    <Input {...register("website")} placeholder="https://www.yourshop.com" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="hours" className="space-y-6 outline-none">
                        <Card>
                            <CardHeader>
                                <CardTitle>Operating Hours</CardTitle>
                                <CardDescription>Set your shop's opening and closing times</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2"><Clock className="h-3 w-3 text-emerald-500" /> Opening Time</label>
                                        <Input type="time" {...register("opening_time")} className="cursor-pointer" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2"><Clock className="h-3 w-3 text-red-500" /> Closing Time</label>
                                        <Input type="time" {...register("closing_time")} className="cursor-pointer" />
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-dashed text-center">
                                    <p className="text-xs text-muted-foreground">Times are based on your local timezone.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                        <Button type="button" variant="ghost" onClick={() => router.push('/myshop')} disabled={isSaving}>
                            Discard Changes
                        </Button>
                        <Button onClick={handleSubmit(onSubmit)} disabled={isSaving} className="min-w-[150px] shadow-lg shadow-primary/20">
                            {isSaving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Save All Changes</>
                            )}
                        </Button>
                    </div>
                </div>
            </Tabs>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Inventory", value: selectedShop.total_products || 0, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Total Sales", value: selectedShop.total_orders || 0, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Account Status", value: selectedShop.status || 'Active', color: "text-purple-600", bg: "bg-purple-50" }
                ].map((stat, i) => (
                    <Card key={i} className={`${stat.bg} border-none shadow-none`}>
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{stat.label}</p>
                            <p className={`text-xl font-black ${stat.color} capitalize`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default EditShopPage;
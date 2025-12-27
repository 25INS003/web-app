"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useShopStore } from "@/store/shopStore";

import {
    Store,
    Plus,
    Loader2,
    ArrowLeft,
    MapPin,
    Clock,
    Truck,
    Phone,
    Mail,
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

import SelectCategory from "@/components/Dropdowns/selectCategory";

const AddShopPage = () => {
    const router = useRouter();
    // Extract error from store to display server-side validation issues
    const { createNewShop, isLoading, error: storeError } = useShopStore();

    const [category, setCategory] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: "",
            business_name: "",
<<<<<<< HEAD
            categories: [], 
=======
            categories: [], // Initialized as array
>>>>>>> e7394cf1ebcd2d4fb9c1c3eb1b6f542276dfe8da
            delivery_radius_km: 5,
            preparation_time: 30,
            delivery_fee: 0,
            min_order_amount: 0,
            free_delivery_threshold: 0,
            payment_methods: ["cod"],
        }
    });

    // Sync the UI category selection with the form state
    useEffect(() => {
        if (category) {
<<<<<<< HEAD
=======
            // Schema expects an array of category IDs/Names
>>>>>>> e7394cf1ebcd2d4fb9c1c3eb1b6f542276dfe8da
            setValue("categories", [category], { shouldValidate: true });
        }
    }, [category, setValue]);

    const onSubmit = async (data) => {
        // Format the payload to ensure numbers are correctly typed
        const formattedData = {
            ...data,
            shop_lat: Number(data.shop_lat),
            shop_lng: Number(data.shop_lng),
            delivery_radius_km: Number(data.delivery_radius_km),
            delivery_fee: Number(data.delivery_fee),
            free_delivery_threshold: Number(data.free_delivery_threshold),
            min_order_amount: Number(data.min_order_amount),
            preparation_time: Number(data.preparation_time),
        };

<<<<<<< HEAD
        // Call the store action
        await createNewShop(formattedData);

        // FIX: Redirect immediately after await completes without strict checks
        // This ensures the form closes and goes back to the list
        reset();
        setCategory(null);
        router.push("/myshop");
=======
        const result = await createNewShop(formattedData);

        // If the store returns the new shop object, it was successful
        if (result) {
            reset();
            setCategory(null);
            router.push("/myshop");
        }
>>>>>>> e7394cf1ebcd2d4fb9c1c3eb1b6f542276dfe8da
    };

    return (
        <div className="container mx-auto max-w-4xl p-6">
            <Button
                variant="ghost"
                className="mb-4"
                onClick={() => router.back()}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* --- Identity Section --- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-6 w-6" />
                            Shop Identity
                        </CardTitle>
                        <CardDescription>Basic information about your business.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Shop Display Name *</label>
                                <Input
                                    {...register("name", { required: "Name is required" })}
                                    placeholder="e.g. Fresh Mart"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Official Business Name</label>
                                <Input
                                    {...register("business_name")}
                                    placeholder="e.g. Fresh Mart Private Ltd"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category *</label>
                            <SelectCategory value={category} onCateSelect={setCategory} />
<<<<<<< HEAD
=======
                            {/* Registering categories for validation */}
>>>>>>> e7394cf1ebcd2d4fb9c1c3eb1b6f542276dfe8da
                            <input type="hidden" {...register("categories", { required: "Please select a category" })} />
                            {errors.categories && <p className="text-xs text-red-500">{errors.categories.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea {...register("description")} placeholder="Describe your shop..." rows={3} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-1"><Phone size={14} /> Phone *</label>
                                <Input {...register("phone", { required: "Phone is required" })} placeholder="10-digit number" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-1"><Mail size={14} /> Email *</label>
                                <Input type="email" {...register("email", { required: "Email is required" })} placeholder="shop@example.com" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- Location Section --- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-6 w-6" />
                            Location Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Address Line *</label>
                            <Input {...register("address_line", { required: "Address is required" })} placeholder="Street, area, landmark" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input {...register("city", { required: "Required" })} placeholder="City" />
                            <Input {...register("state", { required: "Required" })} placeholder="State" />
                            <Input {...register("pincode", { required: "Required" })} placeholder="Pincode" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Latitude *</label>
                                <Input step="any" type="number" {...register("shop_lat", { required: "Required" })} placeholder="0.0000" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Longitude *</label>
                                <Input step="any" type="number" {...register("shop_lng", { required: "Required" })} placeholder="0.0000" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- Operations & Delivery --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="h-5 w-5" />
                                Operations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold">Opening Time *</label>
                                    <Input type="time" {...register("opening_time", { required: "Required" })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold">Closing Time *</label>
                                    <Input type="time" {...register("closing_time", { required: "Required" })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prep Time (mins)</label>
                                <Input type="number" {...register("preparation_time")} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Truck className="h-5 w-5" />
                                Delivery Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold">Radius (KM) *</label>
                                    <Input type="number" {...register("delivery_radius_km", { required: true })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold">Delivery Fee</label>
                                    <Input type="number" {...register("delivery_fee")} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold">Min Order Amount</label>
                                <Input type="number" {...register("min_order_amount")} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

<<<<<<< HEAD
=======
                {/* Global Error Display from Store */}
>>>>>>> e7394cf1ebcd2d4fb9c1c3eb1b6f542276dfe8da
                {storeError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {storeError}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/myshop")}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button type="submit" disabled={isLoading} className="min-w-[150px]">
                        {isLoading ? (
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
                </div>
            </form>
        </div>
    );
};

export default AddShopPage;
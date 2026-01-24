"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useShopStore } from "@/store/shopStore";
import { toast } from "sonner";

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
    Building2,
    Navigation
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SelectCategory from "@/components/Dropdowns/selectCategory";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/Maps/MapPicker"), { 
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl flex items-center justify-center text-slate-400">Loading Map...</div>
});

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 }
    }
};

const AddShopPage = () => {
    const router = useRouter();
    const { createNewShop, isLoading, error: storeError } = useShopStore();
    const [category, setCategory] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: "",
            business_name: "",
            categories: [],
            delivery_radius_km: 5,
            preparation_time: 30,
            delivery_fee: 0,
            min_order_amount: 0,
            free_delivery_threshold: 0,
            payment_methods: ["cod"],
            shop_lat: "",
            shop_lng: "",
        }
    });

    const shopLat = watch("shop_lat");
    const shopLng = watch("shop_lng");

    const [isDetecting, setIsDetecting] = useState(false);

    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            
            if (data.address) {
                const { 
                    road, 
                    suburb, 
                    neighbourhood, 
                    city, 
                    town, 
                    village, 
                    state, 
                    postcode 
                } = data.address;

                const addressLine = [road, neighbourhood, suburb].filter(Boolean).join(", ");
                const detectedCity = city || town || village || "";
                
                setValue("address_line", addressLine, { shouldValidate: true });
                setValue("city", detectedCity, { shouldValidate: true });
                setValue("state", state || "", { shouldValidate: true });
                setValue("pincode", postcode || "", { shouldValidate: true });
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setValue("shop_lat", latitude, { shouldValidate: true });
                setValue("shop_lng", longitude, { shouldValidate: true });
                
                await reverseGeocode(latitude, longitude);
                
                setIsDetecting(false);
                toast.success("Location and address detected!");
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsDetecting(false);
                toast.error("Failed to detect location. Please enter manually.");
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleLocationChange = async (lat, lng) => {
        setValue("shop_lat", lat, { shouldValidate: true });
        setValue("shop_lng", lng, { shouldValidate: true });
        await reverseGeocode(lat, lng);
    };

    useEffect(() => {
        if (category) {
            setValue("categories", [category], { shouldValidate: true });
        }
    }, [category, setValue]);

    const onSubmit = async (data) => {
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

        const result = await createNewShop(formattedData);

        if (result) {
            reset();
            setCategory(null);
            router.push("/myshop");
        }
    };

    return (
        <motion.div 
            className="container mx-auto max-w-4xl p-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </motion.button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                            <Store className="h-5 w-5 text-white" />
                        </div>
                        Create New Shop
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Set up your business presence
                    </p>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Shop Identity Section */}
                <motion.div 
                    variants={itemVariants}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Shop Identity</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Basic information about your business</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Shop Display Name *</label>
                                <Input
                                    {...register("name", { required: "Name is required" })}
                                    placeholder="e.g. Fresh Mart"
                                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Official Business Name</label>
                                <Input
                                    {...register("business_name")}
                                    placeholder="e.g. Fresh Mart Private Ltd"
                                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category *</label>
                            <SelectCategory value={category} onCateSelect={setCategory} />
                            <input type="hidden" {...register("categories", { required: "Please select a category" })} />
                            {errors.categories && <p className="text-xs text-red-500">{errors.categories.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                            <Textarea 
                                {...register("description")} 
                                placeholder="Describe your shop..." 
                                rows={3}
                                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Phone size={14} className="text-slate-400" /> Phone *
                                </label>
                                <Input 
                                    {...register("phone", { required: "Phone is required" })} 
                                    placeholder="10-digit number"
                                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Mail size={14} className="text-slate-400" /> Email *
                                </label>
                                <Input 
                                    type="email" 
                                    {...register("email", { required: "Email is required" })} 
                                    placeholder="shop@example.com"
                                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Location Section */}
                <motion.div 
                    variants={itemVariants}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/10">
                            <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Location Details</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Where customers can find you</p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDetectLocation}
                            disabled={isDetecting}
                            className="gap-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                        >
                            {isDetecting ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Navigation size={14} />
                            )}
                            {isDetecting ? "Detecting..." : "Detect My Location"}
                        </Button>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address Line *</label>
                            <Input 
                                {...register("address_line", { required: "Address is required" })} 
                                placeholder="Street, area, landmark"
                                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input 
                                {...register("city", { required: "Required" })} 
                                placeholder="City"
                                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                            />
                            <Input 
                                {...register("state", { required: "Required" })} 
                                placeholder="State"
                                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                            />
                            <Input 
                                {...register("pincode", { required: "Required" })} 
                                placeholder="Pincode"
                                className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                            />
                        </div>

                        {/* Coordinates Field (Visible and Editable) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Navigation size={14} /> Latitude *
                                </label>
                                <Input 
                                    step="any" 
                                    type="number" 
                                    {...register("shop_lat", { required: "Latitude is required" })} 
                                    placeholder="0.0000"
                                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                />
                                {errors.shop_lat && <p className="text-xs text-red-500">{errors.shop_lat.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Navigation size={14} /> Longitude *
                                </label>
                                <Input 
                                    step="any" 
                                    type="number" 
                                    {...register("shop_lng", { required: "Longitude is required" })} 
                                    placeholder="0.0000"
                                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                />
                                {errors.shop_lng && <p className="text-xs text-red-500">{errors.shop_lng.message}</p>}
                            </div>
                        </div>

                        {/* Interactive Map */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Pin your shop location on map
                            </label>
                            
                            <MapPicker 
                                lat={Number(shopLat) || null} 
                                lng={Number(shopLng) || null} 
                                onLocationChange={handleLocationChange} 
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Operations & Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                        variants={itemVariants}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10">
                                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Operations</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Opening Time *</label>
                                    <Input 
                                        type="time" 
                                        {...register("opening_time", { required: "Required" })}
                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Closing Time *</label>
                                    <Input 
                                        type="time" 
                                        {...register("closing_time", { required: "Required" })}
                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Prep Time (mins)</label>
                                <Input 
                                    type="number" 
                                    {...register("preparation_time")}
                                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        variants={itemVariants}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/10">
                                <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Delivery Settings</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Radius (KM) *</label>
                                    <Input 
                                        type="number" 
                                        {...register("delivery_radius_km", { required: true })}
                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Delivery Fee</label>
                                    <Input 
                                        type="number" 
                                        {...register("delivery_fee")}
                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Min Order Amount</label>
                                <Input 
                                    type="number" 
                                    {...register("min_order_amount")}
                                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Error Display */}
                {storeError && (
                    <motion.div 
                        variants={itemVariants}
                        className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm"
                    >
                        {storeError}
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div 
                    variants={itemVariants}
                    className="flex justify-end gap-3 pt-4"
                >
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/myshop")}
                        disabled={isLoading}
                        className="rounded-xl border-slate-200 dark:border-slate-700"
                    >
                        Cancel
                    </Button>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                            type="submit" 
                            disabled={isLoading} 
                            className="min-w-[150px] rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25"
                        >
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
                    </motion.div>
                </motion.div>
            </form>
        </motion.div>
    );
};

export default AddShopPage;
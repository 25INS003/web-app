"use client";

import React, { useEffect, useState, use } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SelectCategory from "@/components/Dropdowns/selectCategory";

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

const EditShopPage = ({ params }) => {
    const { shopId } = use(params);
    const router = useRouter();

    const { myShops, fetchMyShops, updateExistingShop, isLoading: storeLoading } = useShopStore();

    const [selectedShop, setSelectedShop] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [activeTab, setActiveTab] = useState("general");
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
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });

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
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 animate-pulse">Fetching shop details...</p>
            </div>
        );
    }

    if (!selectedShop && !storeLoading) {
        return <div className="p-10 text-center text-slate-500">Shop not found.</div>;
    }

    return (
        <motion.div 
            className="container mx-auto p-6 space-y-6 max-w-5xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header Section */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/myshop')}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </motion.button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                                <Store className="h-5 w-5 text-white" />
                            </div>
                            Edit Shop: {selectedShop.name}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your business profile and availability</p>
                    </div>
                </div>
                <Badge 
                    className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        selectedShop.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                >
                    {selectedShop.status?.toUpperCase() || 'ACTIVE'}
                </Badge>
            </motion.div>

            {/* Notifications */}
            {successMessage && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-400 px-4 py-3 rounded-xl flex items-center gap-2"
                >
                    <CheckCircle className="h-5 w-5" /> {successMessage}
                </motion.div>
            )}
            {errorMessage && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2"
                >
                    <AlertCircle className="h-5 w-5" /> {errorMessage}
                </motion.div>
            )}

            <motion.div variants={itemVariants}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    {/* Custom Animated Tab List */}
                    <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 relative">
                            {[
                                { id: "general", label: "General", icon: Store },
                                { id: "contact", label: "Contact", icon: Phone },
                                { id: "business", label: "Business", icon: Building2 },
                                { id: "hours", label: "Hours", icon: Clock },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative z-10 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-colors duration-200 ${
                                        activeTab === tab.id
                                            ? "text-slate-900 dark:text-white"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="active-tab-pill"
                                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <tab.icon className="h-4 w-4" />
                                        {tab.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <TabsContent value="general" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                                    <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Basic Information</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Update your shop's display details and branding</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Shop Brand Image</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            {imagePreview ? (
                                                <div className="relative">
                                                    <img src={imagePreview} alt="Shop Preview" className="h-28 w-28 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setImagePreview(""); setShopImage(null); }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-28 w-28 rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                                                    <ImageIcon className="h-8 w-8 text-slate-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <input type="file" id="shop-image" accept="image/*" onChange={handleImageChange} className="hidden" />
                                            <label htmlFor="shop-image">
                                                <Button type="button" variant="outline" size="sm" asChild className="rounded-xl">
                                                    <span className="cursor-pointer"><Upload className="h-4 w-4 mr-2" /> Change Image</span>
                                                </Button>
                                            </label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">JPG, PNG or WEBP. Max 2MB.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Shop Name</label>
                                        <Input 
                                            {...register("name", { required: "Shop name is required" })} 
                                            placeholder="Enter shop name"
                                            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                        />
                                        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                                        <Textarea 
                                            {...register("description")} 
                                            rows={4} 
                                            placeholder="Tell customers about your shop..."
                                            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
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
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/10">
                                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Contact & Location</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">How customers can reach you and find your store</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-slate-400" /> Email Address
                                        </label>
                                        <Input 
                                            type="email" 
                                            {...register("email")} 
                                            placeholder="business@example.com"
                                            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-slate-400" /> Phone Number
                                        </label>
                                        <Input 
                                            {...register("phone")} 
                                            placeholder="+1 234 567 890"
                                            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-slate-400" /> Street Address
                                    </label>
                                    <Textarea 
                                        {...register("address")} 
                                        rows={2} 
                                        placeholder="Building, Street, Area"
                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
                                        <Input 
                                            {...register("city")} 
                                            placeholder="City"
                                            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
                                        <Input 
                                            {...register("state")} 
                                            placeholder="State"
                                            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pincode</label>
                                        <Input 
                                            {...register("pincode")} 
                                            placeholder="Zip Code"
                                            className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="business" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10">
                                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Business Registration</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Official business details and web presence</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-slate-400" /> GST Number / Tax ID
                                    </label>
                                    <Input 
                                        {...register("gst_number")} 
                                        placeholder="22AAAAA0000A1Z5"
                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-slate-400" /> Website URL
                                    </label>
                                    <Input 
                                        {...register("website")} 
                                        placeholder="https://www.yourshop.com"
                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="hours" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/10">
                                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Operating Hours</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Set your shop's opening and closing times</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-green-500" /> Opening Time
                                    </label>
                                    <Input 
                                        type="time" 
                                        {...register("opening_time")} 
                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-red-500" /> Closing Time
                                    </label>
                                    <Input 
                                        type="time" 
                                        {...register("closing_time")} 
                                        className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Times are based on your local timezone.</p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => router.push('/myshop')} 
                            disabled={isSaving}
                            className="rounded-xl"
                        >
                            Discard Changes
                        </Button>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                                onClick={handleSubmit(onSubmit)} 
                                disabled={isSaving} 
                                className="min-w-[150px] rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25"
                            >
                                {isSaving ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4" /> Save All Changes</>
                                )}
                            </Button>
                        </motion.div>
                    </div>
                </Tabs>
            </motion.div>

            {/* Stats Summary */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Inventory", value: selectedShop.total_products || 0, gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10" },
                    { label: "Total Sales", value: selectedShop.total_orders || 0, gradient: "from-green-500 to-emerald-600", bg: "bg-green-50 dark:bg-green-500/10" },
                    { label: "Account Status", value: selectedShop.status || 'Active', gradient: "from-purple-500 to-purple-600", bg: "bg-purple-50 dark:bg-purple-500/10" }
                ].map((stat, i) => (
                    <motion.div 
                        key={i} 
                        whileHover={{ y: -4 }}
                        className={`${stat.bg} rounded-2xl p-5 border border-transparent`}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold capitalize bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>{stat.value}</p>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
};

export default EditShopPage;
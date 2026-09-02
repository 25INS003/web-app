"use client";

import React, { useEffect, useState, use } from "react";
import { useForm } from "react-hook-form";
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
    ArrowLeft,
    Truck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    const [pincodes, setPincodes] = useState([]);
    const [currentPincode, setCurrentPincode] = useState("");
    const [imagePreview, setImagePreview] = useState("");

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        if (myShops.length === 0) {
            fetchMyShops();
        }
    }, [fetchMyShops, myShops.length]);

    useEffect(() => {
        const shop = myShops.find(s => s.id === shopId);
        if (shop) {
            setSelectedShop(shop);
            reset({
                name: shop.name || "",
                description: shop.description || "",
                email: shop.email || "",
                phone: shop.phone || "",
                address_line: shop.address_line || "",
                city: shop.city || "",
                state: shop.state || "",
                pincode: shop.pincode || "",
                business_name: shop.business_name || "",
                opening_time: shop.opening_time || "09:00",
                closing_time: shop.closing_time || "21:00",
                website: shop.website || "",
                shop_lat: shop.shop_lat || "",
                shop_lng: shop.shop_lng || "",
                // The column is `preparation_time_min`; the form field is
                // `preparation_time`. Reading the form's name off the API row
                // meant this always fell through to 30, so a shop with a
                // 45-minute prep time opened its own edit page showing 30 —
                // and saving the form then wrote that 30 back.
                preparation_time: shop.preparation_time_min ?? 30,
                delivery_fee: shop.delivery_fee || 0,
                min_order_amount: shop.min_order_amount || 0,
                free_delivery_threshold: shop.free_delivery_threshold || 0,
            });
            setPincodes(shop.delivery_pincodes || []);
            setImagePreview(shop.image || "");
        } else if (!storeLoading && myShops.length > 0) {
            setErrorMessage("Shop not found.");
            setTimeout(() => router.push('/myshop'), 2000);
        }
    }, [shopId, myShops, reset, storeLoading, router]);

    const handleAddPincode = () => {
        if (!currentPincode) return;
        if (pincodes.includes(currentPincode)) {
             setErrorMessage("Pincode already added"); 
             return;
        }
        setPincodes([...pincodes, currentPincode]);
        setCurrentPincode("");
    };

    const handleRemovePincode = (code) => {
        setPincodes(pincodes.filter(p => p !== code));
    };

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
            if (shopImage) {
                formData.append('image', shopImage);
            }
            
            // Explicitly cast numbers and append others
            Object.keys(data).forEach(key => {
                if (key === 'shop_lat' || key === 'shop_lng' || key === 'delivery_fee' || key === 'min_order_amount' || key === 'free_delivery_threshold' || key === 'preparation_time') {
                    formData.set(key, Number(data[key]));
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.set(key, data[key]);
                }
            });

            // Send pincodes as JSON string to ensure array structure is preserved
            formData.set('delivery_pincodes', JSON.stringify(pincodes));

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
        return <div className="p-10 text-center text-muted-foreground">Shop not found.</div>;
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
                        className="p-2 rounded-xl bg-muted hover:bg-accent transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </motion.button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-foreground">
                            <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/25">
                                <Store className="h-5 w-5 text-primary-foreground" />
                            </div>
                            Edit Shop: {selectedShop.name}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage your business profile and availability</p>
                    </div>
                </div>
                <Badge 
                    className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        selectedShop.status === 'active'
                            ? 'bg-success/15 text-success'
                            : 'bg-muted text-muted-foreground'
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
                    className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-xl flex items-center gap-2"
                >
                    <CheckCircle className="h-5 w-5" /> {successMessage}
                </motion.div>
            )}
            {errorMessage && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl flex items-center gap-2"
                >
                    <AlertCircle className="h-5 w-5" /> {errorMessage}
                </motion.div>
            )}

            <motion.div variants={itemVariants}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    {/* Custom Animated Tab List */}
                    <div className="bg-muted p-1.5 rounded-2xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 relative">
                            {[
                                { id: "general", label: "General", icon: Store },
                                { id: "contact", label: "Contact", icon: Phone },
                                { id: "business", label: "Business", icon: Building2 },
                                { id: "hours", label: "Hours", icon: Clock },
                                { id: "delivery", label: "Delivery", icon: Truck },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative z-10 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-colors duration-200 ${
                                        activeTab === tab.id
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="active-tab-pill"
                                            className="absolute inset-0 bg-background rounded-xl shadow-sm"
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
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Store className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
                                    <p className="text-sm text-muted-foreground">Update your shop's display details and branding</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-foreground">Shop Brand Image</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            {imagePreview ? (
                                                <div className="relative">
                                                    <img src={imagePreview} alt="Shop Preview" className="h-28 w-28 rounded-2xl object-cover border-2 border-border" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setImagePreview(""); setShopImage(null); }}
                                                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-28 w-28 rounded-2xl bg-muted flex flex-col items-center justify-center border-2 border-dashed border-border">
                                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
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
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">JPG, PNG or WEBP. Max 2MB.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Shop Name</label>
                                        <Input 
                                            {...register("name", { required: "Shop name is required" })} 
                                            placeholder="Enter shop name"
                                            className="rounded-xl bg-muted/50"
                                        />
                                        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Description</label>
                                        <Textarea 
                                            {...register("description")} 
                                            rows={4} 
                                            placeholder="Tell customers about your shop..."
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>

                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <MapPin className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Contact & Location</h2>
                                    <p className="text-sm text-muted-foreground">How customers can reach you and find your store</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
                                        </label>
                                        <Input 
                                            type="email" 
                                            {...register("email")} 
                                            placeholder="business@example.com"
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" /> Phone Number
                                        </label>
                                        <Input 
                                            {...register("phone")} 
                                            placeholder="+1 234 567 890"
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" /> Street Address
                                    </label>
                                    <Textarea 
                                        {...register("address_line")} 
                                        rows={2} 
                                        placeholder="Building, Street, Area"
                                        className="rounded-xl bg-muted/50"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">City</label>
                                        <Input 
                                            {...register("city")} 
                                            placeholder="City"
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">State</label>
                                        <Input 
                                            {...register("state")} 
                                            placeholder="State"
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Pincode</label>
                                        <Input 
                                            {...register("pincode")} 
                                            placeholder="Zip Code"
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="business" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Business Registration</h2>
                                    <p className="text-sm text-muted-foreground">Official business details and web presence</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" /> Official Business Name
                                    </label>
                                    <Input 
                                        {...register("business_name")} 
                                        placeholder="e.g. Fresh Mart Private Ltd"
                                        className="rounded-xl bg-muted/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" /> Website URL
                                    </label>
                                    <Input 
                                        {...register("website")} 
                                        placeholder="https://www.yourshop.com"
                                        className="rounded-xl bg-muted/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="hours" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Operating Hours</h2>
                                    <p className="text-sm text-muted-foreground">Set your shop's opening and closing times</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" /> Opening Time
                                    </label>
                                    <Input 
                                        type="time" 
                                        {...register("opening_time")} 
                                        className="rounded-xl bg-muted/50 cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" /> Closing Time
                                    </label>
                                    <Input 
                                        type="time" 
                                        {...register("closing_time")} 
                                        className="rounded-xl bg-muted/50 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-dashed border-border text-center">
                                <p className="text-xs text-muted-foreground">Times are based on your local timezone.</p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="delivery" className="space-y-6 outline-none">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Truck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Delivery Settings</h2>
                                    <p className="text-sm text-muted-foreground">Manage delivery areas and fees</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-foreground">Delivery Pincodes</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={currentPincode}
                                            onChange={(e) => setCurrentPincode(e.target.value)}
                                            placeholder="Enter pincode"
                                            className="rounded-xl bg-muted/50"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddPincode();
                                                }
                                            }}
                                        />
                                        <Button 
                                            type="button"
                                            onClick={handleAddPincode}
                                            className="rounded-xl"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    
                                    {pincodes.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {pincodes.map((pin, index) => (
                                                <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm border border-primary/20">
                                                    <span>{pin}</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemovePincode(pin)}
                                                        className="hover:text-destructive ml-1"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">No delivery pincodes added yet.</p>
                                    )}
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Delivery Fee</label>
                                        <Input 
                                            type="number"
                                            {...register("delivery_fee")} 
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Min Order Amount</label>
                                        <Input 
                                            type="number"
                                            {...register("min_order_amount")} 
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                     <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Free Delivery Threshold</label>
                                        <Input 
                                            type="number"
                                            {...register("free_delivery_threshold")} 
                                            className="rounded-xl bg-muted/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border">
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
                                className="min-w-[150px] rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
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
                    { label: "Inventory", value: selectedShop.total_products || 0, tone: "text-primary", bg: "bg-primary/10" },
                    { label: "Total Sales", value: selectedShop.total_orders || 0, tone: "text-success", bg: "bg-success/10" },
                    { label: "Account Status", value: selectedShop.status || 'Active', tone: "text-foreground", bg: "bg-muted" }
                ].map((stat, i) => (
                    <motion.div 
                        key={i} 
                        whileHover={{ y: -4 }}
                        className={`${stat.bg} rounded-2xl p-5 border border-transparent`}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold capitalize ${stat.tone}`}>{stat.value}</p>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
};

export default EditShopPage;
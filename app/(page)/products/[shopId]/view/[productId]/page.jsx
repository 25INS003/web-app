"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useProductStore } from "@/store/productStore";
import { useVariantStore } from "@/store/productVariantStore";

// --- Icons ---
import {
    ArrowLeft,
    Tag,
    Package,
    XCircle,
    AlertTriangle,
    ImageIcon,
    Settings,
    Box,
    Check,
    Receipt,
    ImageOff,
    Eye,
    Sparkles,
    Layers
} from "lucide-react";

// --- Shadcn UI ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

// --- Components ---
const DisplayField = ({ label, value, icon: Icon, className = "", tooltip = "" }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn("space-y-2 p-4 rounded-xl hover:bg-muted transition-colors bg-muted/50", className)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                            {Icon && <Icon className="w-4 h-4 mr-2" />}
                            {label}
                        </div>
                        {tooltip && <div className="text-muted-foreground text-[10px] border border-border rounded-full w-4 h-4 flex items-center justify-center">i</div>}
                    </div>
                    <p className="text-lg font-semibold text-foreground break-words">
                        {value || "N/A"}
                    </p>
                </div>
            </TooltipTrigger>
            {tooltip && (
                <TooltipContent>
                    <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
            )}
        </Tooltip>
    </TooltipProvider>
);

// Helper to format currency
const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);
};

const ViewProductPage = () => {
    const router = useRouter();
    const params = useParams();
    const { shopId, productId } = params;

    const {
        currentProduct,
        currentVariants,
        getProductDetails,
        resetProduct,
        isLoading
    } = useProductStore();

    const { isLoading: isStoreLoading } = useVariantStore();

    const [isInitializing, setIsInitializing] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeImage, setActiveImage] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [failedImages, setFailedImages] = useState(new Set());

    const handleImageError = useCallback((src) => {
        setFailedImages(prev => new Set(prev).add(src));
    }, []);

    useEffect(() => {
        if (!shopId || !productId) return;
        let isMounted = true;
        const fetchData = async () => {
            setIsInitializing(true);
            await getProductDetails(shopId, productId);
            if (isMounted) setIsInitializing(false);
        };
        fetchData();
        return () => {
            isMounted = false;
            resetProduct();
        };
    }, [shopId, productId, getProductDetails, resetProduct]);

    useEffect(() => {
        if (currentProduct && currentVariants?.length > 0 && !selectedVariant) {
            const defaultVar = currentVariants.find(v => v.id === currentProduct.default_variant_id) || currentVariants[0];
            setSelectedVariant(defaultVar);
        }
    }, [currentProduct, currentVariants, selectedVariant]);

    useEffect(() => {
        if (selectedVariant) {
            const variantImg = selectedVariant.images?.[0];
            const imgUrl = typeof variantImg === 'string' ? variantImg : variantImg?.url;
            const finalImg = imgUrl || currentProduct?.main_image_url || null;
            setActiveImage(finalImg && finalImg.trim() !== '' ? finalImg : null);
        } else if (currentProduct) {
            const mainImg = currentProduct.main_image_url;
            setActiveImage(mainImg && mainImg.trim() !== '' ? mainImg : null);
        }
    }, [selectedVariant, currentProduct]);

    if (isInitializing || isLoading) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-1/3 rounded-xl" />
                        <Skeleton className="h-4 w-1/4 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2"><Skeleton className="h-[500px] rounded-2xl" /></div>
                        <div><Skeleton className="h-[400px] rounded-2xl" /></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentProduct) {
        return (
            <div className="flex h-screen items-center justify-center">
                <motion.div
                    className="text-center space-y-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/15 flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Product not found</h2>
                    <Button onClick={() => router.back()} className="rounded-xl">Go Back</Button>
                </motion.div>
            </div>
        );
    }

    const displayPrice = selectedVariant ? selectedVariant.price : 0;
    const displayComparePrice = selectedVariant ? selectedVariant.compare_at_price : 0;
    const hasDiscount = displayComparePrice > displayPrice;
    const discountPercent = hasDiscount ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100) : 0;

    const displaySku = selectedVariant?.sku || "N/A";
    const stockQty = selectedVariant?.stock_quantity || 0;
    const lowStockThreshold = selectedVariant?.low_stock_threshold || 5;
    const isLowStock = stockQty <= lowStockThreshold && stockQty > 0;
    const isOutOfStock = stockQty <= 0;

    const galleryImages = [
        currentProduct.main_image_url,
        ...(currentProduct.images || []).map((img) => img?.url),
        ...(selectedVariant?.images || []).map((img) => typeof img === 'string' ? img : img?.url)
    ].filter((url) => url && url.trim() !== '');

    const uniqueImages = [...new Set(galleryImages)];

    return (
        <motion.div
            className="min-h-screen pb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="container mx-auto p-4 lg:p-8 max-w-7xl">

                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        {/*
                          * Goes to the product list, not `router.back()`.
                          *
                          * A button that names its destination has to go there.
                          * Creating a product lands on this page from the add
                          * form, so history's previous entry was "Add New
                          * Product" — "Back to Products" walked the owner
                          * straight back into an empty form.
                          */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/products")}
                            className="rounded-xl hover:bg-muted"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Products
                        </Button>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/products/${shopId}/edit/${currentProduct.id}`)}
                                className="rounded-xl"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Edit Product
                            </Button>
                        </motion.div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-primary shadow-lg shadow-primary/25">
                                <Eye className="h-7 w-7 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                    {currentProduct.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                                    <span className="font-medium text-primary">{currentProduct.brand}</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-primary">{currentProduct.category?.name || 'Uncategorized'}</span>
                                    {currentProduct.unit && (
                                        <>
                                            <span className="text-muted-foreground">•</span>
                                            <span>{currentProduct.unit}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Badge
                            className={cn(
                                "rounded-xl px-3 py-1 text-sm font-medium",
                                currentProduct.is_active
                                    ? "bg-success/15 text-success"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {currentProduct.is_active ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Images & Tabs */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">

                        {/* Image Gallery */}
                        <Card className="rounded-2xl border-border shadow-lg overflow-hidden bg-card">
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-5 min-h-[450px]">
                                    {/* Thumbnails */}
                                    <div className="order-2 md:order-1 col-span-1 p-4 flex md:flex-col gap-3 overflow-auto bg-muted/50 border-r border-border">
                                        {uniqueImages.length > 0 ? uniqueImages.map((src, idx) => (
                                            <button
                                                key={`${src}-${idx}`}
                                                onClick={() => setActiveImage(src)}
                                                className={cn(
                                                    "relative flex-shrink-0 w-16 h-16 md:w-full md:h-20 rounded-xl overflow-hidden border-2 transition-all",
                                                    activeImage === src
                                                        ? "border-primary ring-2 ring-primary/30"
                                                        : "border-transparent hover:border-border",
                                                    failedImages.has(src) && "border-destructive/40 bg-destructive/10"
                                                )}
                                            >
                                                {failedImages.has(src) ? (
                                                    <div className="flex items-center justify-center w-full h-full bg-destructive/10">
                                                        <ImageOff className="w-6 h-6 text-destructive" />
                                                    </div>
                                                ) : (
                                                    <ProgressiveImage
                                                        src={src}
                                                        alt={`Thumbnail ${idx + 1}`}
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                        onError={() => handleImageError(src)}
                                                    />
                                                )}
                                            </button>
                                        )) : (
                                            <div className="text-xs text-center text-muted-foreground py-4">No images</div>
                                        )}
                                    </div>

                                    {/* Main Display */}
                                    <div className="order-1 md:order-2 col-span-1 md:col-span-4 relative bg-muted/30 flex items-center justify-center p-8 h-[450px]">
                                        {activeImage && !failedImages.has(activeImage) ? (
                                            <div className="relative w-full h-full">
                                                <ProgressiveImage
                                                    src={activeImage}
                                                    alt={currentProduct.name}
                                                    className="absolute inset-0 h-full w-full object-contain transition-all duration-300"
                                                    onError={() => handleImageError(activeImage)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-muted-foreground">
                                                {failedImages.has(activeImage) ? (
                                                    <>
                                                        <div className="p-4 rounded-2xl bg-destructive/15 mb-3">
                                                            <ImageOff className="w-12 h-12 text-destructive" />
                                                        </div>
                                                        <p className="text-destructive font-medium">Image Failed to Load</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="p-4 rounded-2xl bg-muted mb-3">
                                                            <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-muted-foreground">No Image Available</p>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* `text-white`, not `text-primary-foreground`: that token pairs
                                            with --primary, and nothing guarantees it contrasts against
                                            --destructive. This is what the destructive Button variant uses. */}
                                        {hasDiscount && (
                                            <div className="absolute top-4 right-4 bg-destructive text-white px-4 py-1.5 rounded-xl text-sm font-bold shadow-lg z-10">
                                                {discountPercent}% OFF
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full md:w-auto justify-start h-auto p-1.5 bg-muted rounded-2xl gap-1 border-0">
                                <TabsTrigger
                                    value="overview"
                                    className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border-0"
                                >
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="details"
                                    className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md border-0"
                                >
                                    System Details
                                </TabsTrigger>
                            </TabsList>
                            <div className="pt-6">
                                <TabsContent value="overview" className="space-y-6 mt-0">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Card className="rounded-2xl border-border bg-card">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-primary/15">
                                                        <Sparkles className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <CardTitle className="text-lg">Description</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {currentProduct.description || "No description provided."}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </TabsContent>
                                <TabsContent value="details" className="mt-0">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="grid grid-cols-2 md:grid-cols-3 gap-4"
                                    >
                                        <DisplayField label="Created At" value={new Date(currentProduct.created_at).toLocaleDateString()} />
                                        <DisplayField label="Last Updated" value={new Date(currentProduct.updated_at).toLocaleDateString()} />
                                        <DisplayField label="Total Variants" value={currentVariants?.length || 0} icon={Layers} />
                                    </motion.div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </motion.div>

                    {/* Right Column: Variant Selector & Details */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        <Card className="rounded-2xl border-border shadow-xl bg-card overflow-hidden sticky top-8 border-t-4 border-t-primary">
                            <CardHeader className="pb-2 bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-primary/15">
                                        <Package className="h-4 w-4 text-primary" />
                                    </div>
                                    <CardTitle className="text-base font-medium text-muted-foreground">
                                        Selected Variant Details
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">

                                {/* Pricing */}
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-foreground">
                                            {formatPrice(displayPrice)}
                                        </span>
                                        <span className="text-sm text-muted-foreground">per {selectedVariant?.per_unit_qty || 1} {selectedVariant?.unit || 'piece'}</span>
                                    </div>
                                    {hasDiscount && (
                                        <div className="mt-3 flex items-center gap-2 text-sm bg-success/10 p-3 rounded-xl w-fit border border-success/30">
                                            <span className="text-muted-foreground line-through">{formatPrice(displayComparePrice)}</span>
                                            <span className="text-success font-semibold">
                                                Save {formatPrice(displayComparePrice - displayPrice)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Variant Selector Grid */}
                                {currentVariants?.length > 1 && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-foreground">
                                            Available Variants ({currentVariants.length})
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {currentVariants.map((variant) => {
                                                const isSelected = selectedVariant?.id === variant.id;
                                                return (
                                                    <button
                                                        key={variant.id}
                                                        onClick={() => setSelectedVariant(variant)}
                                                        className={cn(
                                                            "relative flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all hover:bg-muted",
                                                            isSelected
                                                                ? "border-primary bg-primary/10"
                                                                : "border-border"
                                                        )}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 text-primary">
                                                                <Check className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-semibold text-foreground truncate w-full pr-4">
                                                            {variant.name || variant.sku || "Variant"}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground mt-1">
                                                            {formatPrice(variant.price)}
                                                        </span>
                                                        {variant.stock_quantity <= 0 && (
                                                            <span className="text-[10px] text-destructive font-medium mt-1">Out of Stock</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {currentVariants?.length > 1 && <Separator />}

                                {/* SKU & IDs */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-muted/50">
                                        <span className="text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4" /> SKU</span>
                                        <span className="font-mono font-medium text-foreground">{displaySku}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-muted/50">
                                        <span className="text-muted-foreground flex items-center gap-2"><Box className="w-4 h-4" /> Variant ID</span>
                                        <span className="font-mono text-xs text-muted-foreground" title={selectedVariant?.id}>
                                            ...{selectedVariant?.id?.slice(-8)}
                                        </span>
                                    </div>
                                </div>

                                <Separator />

                                {/* Stock Status */}
                                <div className="space-y-3 p-4 rounded-xl bg-muted/50">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium flex items-center gap-2">
                                            <Package className="w-4 h-4" /> Inventory
                                        </span>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-success"
                                        )}>
                                            {stockQty} available
                                        </span>
                                    </div>
                                    <Progress
                                        value={isOutOfStock ? 0 : isLowStock ? 15 : Math.min(100, (stockQty / 100) * 100)}
                                        className={cn(
                                            "h-2.5 rounded-full",
                                            isOutOfStock ? "bg-destructive/15 [&>div]:bg-destructive" :
                                                isLowStock ? "bg-warning/15 [&>div]:bg-warning" :
                                                    "bg-success/15 [&>div]:bg-success"
                                        )}
                                    />
                                    {isLowStock && !isOutOfStock && (
                                        <div className="text-xs text-warning flex items-center gap-1 mt-1 font-medium">
                                            <AlertTriangle className="w-3 h-3" /> Low stock alert
                                        </div>
                                    )}
                                </div>

                                {/* Attributes */}
                                {selectedVariant?.attributes && (Array.isArray(selectedVariant.attributes) ? selectedVariant.attributes.length > 0 : Object.keys(selectedVariant.attributes).length > 0) && (
                                    <>
                                        <Separator />
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {Array.isArray(selectedVariant.attributes) ? (
                                                selectedVariant.attributes.map((attr, index) => (
                                                    <div key={index} className="bg-muted/50 p-3 rounded-xl">
                                                        <span className="text-muted-foreground block text-xs capitalize">{attr.name}</span>
                                                        <span className="font-semibold text-foreground">{attr.value}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                Object.entries(selectedVariant.attributes).map(([key, val]) => {
                                                    const displayValue = (typeof val === 'object' && val !== null && val.value) ? val.value : val;
                                                    return (
                                                        <div key={key} className="bg-muted/50 p-3 rounded-xl">
                                                            <span className="text-muted-foreground block text-xs capitalize">{key}</span>
                                                            <span className="font-semibold text-foreground">{displayValue}</span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* GST / Tax Section */}
                                {(() => {
                                    let taxArray = [];
                                    if (selectedVariant?.tax) {
                                        if (Array.isArray(selectedVariant.tax)) {
                                            taxArray = selectedVariant.tax.filter(t => t && (t.name || t.rate !== undefined));
                                        } else if (typeof selectedVariant.tax === 'object' && selectedVariant.tax !== null) {
                                            const entries = selectedVariant.tax instanceof Map
                                                ? Array.from(selectedVariant.tax.entries())
                                                : Object.entries(selectedVariant.tax);
                                            taxArray = entries.map(([name, rate]) => ({ name, rate: Number(rate) || 0 }));
                                        }
                                    }

                                    if (taxArray.length === 0) return null;

                                    return (
                                        <>
                                            <Separator />
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm font-medium text-warning">
                                                    <Receipt className="w-4 h-4" />
                                                    GST / Tax Breakdown
                                                </div>
                                                <div className="bg-warning/10 rounded-xl p-4 space-y-2 border border-warning/30">
                                                    {taxArray.map((t, idx) => (
                                                        <div key={idx} className="flex justify-between items-center">
                                                            <span className="text-sm text-muted-foreground">{t.name}</span>
                                                            <span className="font-semibold text-warning">{t.rate}%</span>
                                                        </div>
                                                    ))}
                                                    <div className="pt-2 border-t border-warning/30 flex justify-between items-center">
                                                        <span className="text-sm font-medium text-foreground">Total Tax</span>
                                                        <span className="font-bold text-warning">
                                                            {taxArray.reduce((sum, t) => sum + (t.rate || 0), 0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}

                            </CardContent>
                        </Card>
                    </motion.div>

                </div>
            </div>
        </motion.div>
    );
};

export default ViewProductPage;
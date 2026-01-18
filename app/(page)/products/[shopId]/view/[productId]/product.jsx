"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image"; 
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/store/productStore";
import { useVariantStore } from "@/store/productVariantStore";
import VariantList from "./variant";
// --- Icons ---
import {
    ArrowLeft,
    Tag,
    Package,
    XCircle,
    AlertTriangle,
    ImageIcon,
    ShoppingCart,
    Settings,
    Box,
    Check,
    Receipt
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

// --- Components ---

const DisplayField = ({ label, value, icon: Icon, className = "", tooltip = "" }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn("space-y-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", className)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                            {Icon && <Icon className="w-4 h-4 mr-2" />}
                            {label}
                        </div>
                        {tooltip && <div className="text-slate-400 text-[10px] border border-slate-200 rounded-full w-4 h-4 flex items-center justify-center">i</div>}
                    </div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 break-words">
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

const ViewProductPage = ({ shopId, productId }) => {
    const router = useRouter();

    const {
        currentProduct,
        currentVariants,
        getProductDetails,
        resetProduct,
        isLoading
    } = useProductStore();

    // We don't strictly need detailed variant fetch if currentVariants contains basic info,
    // but keeping the hook if you use it for other logic.
    const {
        isLoading: isStoreLoading,
    } = useVariantStore();

    const [isInitializing, setIsInitializing] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeImage, setActiveImage] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    // --- 1. Fetch Product Data ---
    useEffect(() => {
        if (!shopId || !productId) return;
        let isMounted = true;
        const fetchData = async () => {
            setIsInitializing(true);
            await getProductDetails(shopId, productId);
            if (isMounted) {
                setIsInitializing(false);
            }
        };
        fetchData();
        return () => {
            isMounted = false;
            resetProduct();
        };
    }, [shopId, productId, getProductDetails, resetProduct]);

    // --- 2. Set Default Variant ---
    useEffect(() => {
        // Only set default if we have products and no variant is currently selected
        if (currentProduct && currentVariants?.length > 0 && !selectedVariant) {
            const defaultVar = currentVariants.find(v => v._id === currentProduct.default_variant_id) || currentVariants[0];
            setSelectedVariant(defaultVar);
        }
    }, [currentProduct, currentVariants, selectedVariant]);

    // --- 3. Handle Image Selection ---
    useEffect(() => {
        if (selectedVariant) {
            // Priority: Variant Image -> Product Main Image
            // Treat empty strings as falsy
            const variantImg = selectedVariant.images?.[0]?.url;
            const productImg = currentProduct?.main_image?.url;
            const img = (variantImg && variantImg.trim() !== '') 
                ? variantImg 
                : (productImg && productImg.trim() !== '') 
                    ? productImg 
                    : null;
            setActiveImage(img);
        } else if (currentProduct) {
            const productImg = currentProduct.main_image?.url;
            setActiveImage((productImg && productImg.trim() !== '') ? productImg : null);
        }
    }, [selectedVariant, currentProduct]);


    // --- Loading State ---
    if (isInitializing || isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-1/3 dark:bg-slate-800" />
                        <Skeleton className="h-4 w-1/4 dark:bg-slate-800" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2"><Skeleton className="h-[500px] rounded-xl dark:bg-slate-800" /></div>
                        <div><Skeleton className="h-[300px] rounded-xl dark:bg-slate-800" /></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentProduct) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center space-y-4">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product not found</h2>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    // --- Derived Data for Display ---
    const displayPrice = selectedVariant ? selectedVariant.price : 0;
    const displayComparePrice = selectedVariant ? selectedVariant.compare_at_price : 0;
    const hasDiscount = displayComparePrice > displayPrice;
    const discountPercent = hasDiscount ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100) : 0;

    const displaySku = selectedVariant?.sku || "N/A";
    const stockQty = selectedVariant?.stock_quantity || 0;
    const lowStockThreshold = selectedVariant?.low_stock_threshold || 5;
    const isLowStock = stockQty <= lowStockThreshold && stockQty > 0;
    const isOutOfStock = stockQty <= 0;

    // Images: Combine Product Main Image + Variant Images for the gallery
    // Helper to validate URLs
    const isValidUrl = (url) => url && typeof url === 'string' && url.trim() !== '';
    
    // Create a mapping of image URL to variant for bi-directional sync
    const imageToVariantMap = {};
    
    // Add product main image (no variant association)
    const productMainImage = currentProduct.main_image?.url;
    
    // Add variant images with their variant association
    currentVariants?.forEach(variant => {
        (variant.images || []).forEach(img => {
            if (isValidUrl(img.url)) {
                imageToVariantMap[img.url] = variant;
            }
        });
    });
    
    const galleryImages = [
        productMainImage,
        ...(currentProduct.images || []).map((img) => img.url),
        // Add ALL variant images (not just selected variant)
        ...(currentVariants || []).flatMap(v => (v.images || []).map(img => img.url))
    ].filter(isValidUrl); // Filter out null, undefined, and empty strings

    const uniqueImages = [...new Set(galleryImages)];
    
    // Only use validated images for rendering
    const validImages = uniqueImages.filter(isValidUrl);
    
    console.log("DEBUG: validImages =", validImages, "uniqueImages =", uniqueImages);
    
    // Handler for thumbnail click - selects image and corresponding variant
    const handleImageClick = (src) => {
        setActiveImage(src);
        // If this image belongs to a variant, select that variant
        const variant = imageToVariantMap[src];
        if (variant) {
            setSelectedVariant(variant);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-12">
            <div className="container mx-auto p-4 lg:p-8 max-w-7xl">

                {/* --- Header --- */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="pl-0 hover:bg-transparent hover:text-blue-600"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Products
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/products/${shopId}/edit/${currentProduct._id}`)}
                                className="text-slate-600 dark:text-slate-300"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Edit Product
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                {currentProduct.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                    {currentProduct.brand}
                                </span>
                                <span>•</span>
                                <span>{currentProduct.category_id?.name || 'Uncategorized'}</span>
                                <span>•</span>
                                <span>{currentProduct.unit}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={currentProduct.is_active ? "default" : "secondary"}>
                                {currentProduct.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* --- Left Column: Images & Tabs --- */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Image Gallery */}
                        <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-5 min-h-[450px]">
                                    {/* Thumbnails */}
                                    <div className="order-2 md:order-1 col-span-1 p-4 flex md:flex-col gap-3 overflow-auto bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800">
                                        {validImages.length > 0 ? validImages.map((src, idx) => (
                                            <button
                                                key={`${src}-${idx}`}
                                                onClick={() => handleImageClick(src)}
                                                className={cn(
                                                    "relative flex-shrink-0 w-16 h-16 md:w-full md:h-20 rounded-md overflow-hidden border-2 transition-all",
                                                    activeImage === src
                                                        ? "border-blue-600 ring-2 ring-blue-100"
                                                        : "border-transparent hover:border-slate-300"
                                                )}
                                            >
                                                <Image
                                                    src={src}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, 150px"
                                                />
                                            </button>
                                        )) : (
                                            <div className="text-xs text-center text-slate-400 py-4">No images</div>
                                        )}
                                    </div>

                                    {/* Main Display */}
                                    <div className="order-1 md:order-2 col-span-1 md:col-span-4 relative bg-white dark:bg-slate-900 flex items-center justify-center p-8 h-[450px]">
                                        {activeImage && activeImage.trim() !== '' ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={activeImage}
                                                    alt={currentProduct.name}
                                                    fill
                                                    className="object-contain transition-all duration-300"
                                                    priority
                                                    sizes="(max-width: 768px) 100vw, 800px"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-300">
                                                <ImageIcon className="w-20 h-20 mb-2 opacity-50" />
                                                <p>No Image Available</p>
                                            </div>
                                        )}

                                        {hasDiscount && (
                                            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg z-10">
                                                {discountPercent}% OFF
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>





                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent dark:border-slate-800">
                                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">Overview</TabsTrigger>
                                <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">System Details</TabsTrigger>
                                <TabsTrigger value="variants" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">Variants</TabsTrigger>
                            </TabsList>
                            <div className="pt-6">
                                <TabsContent value="overview" className="space-y-6">
                                    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <h4 className="text-lg font-semibold mb-2">Description</h4>
                                        <p>{currentProduct.description || "No description provided."}</p>
                                    </div>
                                </TabsContent>
                                <TabsContent value="details">
                                    <div className="grid grid-cols-2 gap-4">
                                        <DisplayField label="Created At" value={new Date(currentProduct.created_at).toLocaleDateString()} />
                                        <DisplayField label="Last Updated" value={new Date(currentProduct.updated_at).toLocaleDateString()} />
                                        <DisplayField label="Total Variants" value={currentVariants?.length || 0} />
                                    </div>
                                </TabsContent>
                                <TabsContent value="variants">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium">Manage Variants</h3>
                                            <Button 
                                                onClick={() => router.push(`/variants/${currentProduct._id}/add`)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                <Box className="w-4 h-4 mr-2" />
                                                Add Variant
                                            </Button>
                                        </div>
                                        <VariantList 
                                            variants={currentVariants} 
                                            shopId={shopId} // Pass down if needed
                                        />
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* --- Right Column: Variant Selector & Details --- */}
                    <div className="space-y-6">
                        <Card className="border-t-4 border-t-blue-600 shadow-lg dark:bg-slate-800 dark:border-slate-700 sticky top-8">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium text-slate-500 dark:text-slate-400">
                                    Selected Variant Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">

                                {/* 1. Pricing */}
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                                            {formatPrice(displayPrice)}
                                        </span>
                                        <span className="text-sm text-slate-500"> per {selectedVariant?.per_unit_qty || 1} {selectedVariant?.unit || 'piece'}</span>
                                    </div>
                                    {hasDiscount && (
                                        <div className="mt-2 flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded-md w-fit">
                                            <span className="text-slate-400 line-through">{formatPrice(displayComparePrice)}</span>
                                            <span className="text-green-700 dark:text-green-400 font-medium">
                                                Save {formatPrice(displayComparePrice - displayPrice)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* 2. Variant Selector Grid */}
                                {currentVariants?.length > 1 && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Available Variants ({currentVariants.length})
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {currentVariants.map((variant) => {
                                                const isSelected = selectedVariant?._id === variant._id;
                                                return (
                                                    <button
                                                        key={variant._id}
                                                        onClick={() => setSelectedVariant(variant)}
                                                        className={cn(
                                                            "relative flex flex-col items-start p-3 rounded-lg border text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                                                            isSelected
                                                                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-600"
                                                                : "border-slate-200 dark:border-slate-700"
                                                        )}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 text-blue-600">
                                                                <Check className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                        {/* Assuming variant has a name, otherwise fallback to SKU or generic name */}
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate w-full pr-4">
                                                            {variant.name || variant.sku || "Variant"}
                                                        </span>
                                                        <span className="text-xs text-slate-500 mt-1">
                                                            {formatPrice(variant.price)}
                                                        </span>
                                                        {variant.stock_quantity <= 0 && (
                                                            <span className="text-[10px] text-red-500 font-medium mt-1">Out of Stock</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {currentVariants?.length > 1 && <Separator />}

                                {/* 3. SKU & IDs */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 flex items-center gap-2"><Tag className="w-4 h-4" /> SKU</span>
                                        <span className="font-mono font-medium">{displaySku}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 flex items-center gap-2"><Box className="w-4 h-4" /> Variant ID</span>
                                        <span className="font-mono text-xs text-slate-400" title={selectedVariant?._id}>
                                            ...{selectedVariant?._id?.slice(-8)}
                                        </span>
                                    </div>
                                </div>

                                <Separator />

                                {/* 4. Stock Status */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium flex items-center gap-2">
                                            <Package className="w-4 h-4" /> Inventory
                                        </span>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-green-600"
                                        )}>
                                            {stockQty} available
                                        </span>
                                    </div>
                                    <Progress
                                        value={isOutOfStock ? 0 : isLowStock ? 10 : 100}
                                        className={cn("h-2", isLowStock ? "bg-amber-100 [&>div]:bg-amber-500" : "bg-green-100 [&>div]:bg-green-500")}
                                    />
                                    {isLowStock && !isOutOfStock && (
                                        <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                            <AlertTriangle className="w-3 h-3" /> Low stock alert
                                        </div>
                                    )}
                                </div>

                                {/* 5. Attributes (Handles both array [{name, value}] and object {key: value} formats) */}
                                {selectedVariant?.attributes && (
                                    Array.isArray(selectedVariant.attributes) 
                                        ? selectedVariant.attributes.length > 0 
                                        : Object.keys(selectedVariant.attributes).length > 0
                                ) && (
                                    <>
                                        <Separator />
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {Array.isArray(selectedVariant.attributes) 
                                                ? selectedVariant.attributes.map((attr, idx) => (
                                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                                                        <span className="text-slate-500 block text-xs capitalize">{attr.name}</span>
                                                        <span className="font-medium text-slate-900 dark:text-slate-100">{attr.value}</span>
                                                    </div>
                                                ))
                                                : Object.entries(selectedVariant.attributes).map(([key, val]) => (
                                                    <div key={key} className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                                                        <span className="text-slate-500 block text-xs capitalize">{key}</span>
                                                        <span className="font-medium text-slate-900 dark:text-slate-100">{val}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </>
                                )}

                                {/* 6. Actions */}
                                <div className="pt-4 space-y-2">
                                    <Button className="w-full" disabled={isOutOfStock}>
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>

                        {/* GST / Tax Card */}
                        {(() => {
                            // Normalize tax data - handle both array and object formats
                            let taxArray = [];
                            console.log("selectedVariant?.tax:", selectedVariant?.tax, "type:", typeof selectedVariant?.tax);
                            if (selectedVariant?.tax) {
                                if (Array.isArray(selectedVariant.tax)) {
                                    taxArray = selectedVariant.tax.filter(t => t?.name && t?.rate !== undefined);
                                } else if (typeof selectedVariant.tax === 'object' && selectedVariant.tax !== null) {
                                    // Old Map/Object format: { "IGST": 18 }
                                    taxArray = Object.entries(selectedVariant.tax).map(([name, rate]) => ({ name, rate }));
                                }
                            }
                            console.log("taxArray:", taxArray);
                            return taxArray.length > 0 && (
                                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border dark:border-amber-800/30">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-300">
                                            <Receipt className="w-5 h-5" />
                                            GST / Tax Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            {taxArray.map((t, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                        <span className="font-medium text-slate-700 dark:text-slate-200">{t.name}</span>
                                                    </div>
                                                    <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{t.rate}%</span>
                                                </div>
                                            ))}
                                            {/* Total Tax Summary */}
                                            <div className="mt-2 pt-3 border-t border-amber-200 dark:border-amber-700/50">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Tax Rate</span>
                                                    <span className="text-xl font-bold text-amber-800 dark:text-amber-300">
                                                        {taxArray.reduce((sum, t) => sum + (t.rate || 0), 0)}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">Tax Amount (on ₹{displayPrice})</span>
                                                    <span className="text-lg font-semibold text-green-700 dark:text-green-400">
                                                        ₹{((displayPrice * taxArray.reduce((sum, t) => sum + (t.rate || 0), 0)) / 100).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })()}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ViewProductPage;
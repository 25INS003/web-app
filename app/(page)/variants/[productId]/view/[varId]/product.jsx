"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image"; // Import Next.js Image
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/store/productStore";
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
    Box
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

const ViewProductPage = () => {
    const params = useParams();
    const router = useRouter();
    const { shopId, productId } = params;

    const {
        currentProduct,
        currentVariants,
        getProductDetails,
        isLoading
    } = useProductStore();

    const [isInitializing, setIsInitializing] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeImage, setActiveImage] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    // --- 1. Fetch Product Data ---
    useEffect(() => {
        const init = () => {
            if (shopId && productId) {
                getProductDetails(shopId, productId);
                setIsInitializing(false);
            }
        };
        init();
    }, [shopId, productId, getProductDetails]);

    // --- 2. Set Default Variant ---
    useEffect(() => {
        if (currentProduct && currentVariants?.length > 0 && !selectedVariant) {
            const defaultVar = currentVariants.find(v => v.is_default) || currentVariants[0];
            setSelectedVariant(defaultVar);
        }
    }, [currentProduct, currentVariants, selectedVariant]);

    // --- 3. Handle Image Selection ---
    useEffect(() => {
        if (selectedVariant) {
            const img = selectedVariant.images?.[0] || currentProduct?.main_image?.url || null;
            setActiveImage(img);
        } else if (currentProduct) {
            setActiveImage(currentProduct.main_image?.url);
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
    const galleryImages = [
        ...(currentProduct.main_image?.url ? [currentProduct.main_image.url] : []),
        ...(currentProduct.images || [])
    ].filter(Boolean);
    const uniqueImages = [...new Set(galleryImages)];

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
                                Edit Product Details
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

                    {/* --- Left Column: Images & Variants --- */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Image Gallery */}
                        <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-5 min-h-[450px]">

                                    {/* Thumbnails */}
                                    <div className="order-2 md:order-1 col-span-1 p-4 flex md:flex-col gap-3 overflow-auto bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800">
                                        {uniqueImages.length > 0 ? uniqueImages.map((src, idx) => (
                                            <button
                                                key={`${src}-${idx}`}
                                                onClick={() => setActiveImage(src)}
                                                className={cn(
                                                    "relative flex-shrink-0 w-16 h-16 md:w-full md:h-20 rounded-md overflow-hidden border-2 transition-all",
                                                    activeImage === src
                                                        ? "border-blue-600 ring-2 ring-blue-100"
                                                        : "border-transparent hover:border-slate-300"
                                                )}
                                            >
                                                {/* Optimized Thumbnail Image */}
                                                <Image
                                                    src={src}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, 150px"
                                                />
                                            </button>
                                        )) : (
                                            <div className="text-xs text-center text-slate-400 py-4">No gallery images</div>
                                        )}
                                    </div>

                                    {/* Main Display */}
                                    <div className="order-1 md:order-2 col-span-1 md:col-span-4 relative bg-white dark:bg-slate-900 flex items-center justify-center p-8 h-[450px]">
                                        {activeImage ? (
                                            <div className="relative w-full h-full">
                                                {/* Optimized Main Image */}
                                                <Image
                                                    src={activeImage}
                                                    alt={currentProduct.name || "Product Image"}
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

                        {/* --- Tabs --- */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent dark:border-slate-800">
                                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">Product Overview</TabsTrigger>
                                <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">Additional Details</TabsTrigger>
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
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* --- Right Column: Variant Specifics --- */}
                    <div className="space-y-6">
                        <Card className="border-t-4 border-t-blue-600 shadow-lg dark:bg-slate-800 dark:border-slate-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium text-slate-500 dark:text-slate-400">
                                    Product Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">

                                {/* Price Section */}
                                <div>
                                    <h2 className="mb-4 text-slate-700 dark:text-slate-300 font-medium"> Default Variant price</h2>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                                            {formatPrice(displayPrice)}
                                        </span>
                                        <span className="text-sm text-slate-500"> per {currentProduct.cost_against}</span>
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

                                {/* Variant SKU & ID */}
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

                                {/* Stock Section */}
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
                                    {isLowStock && (
                                        <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                            <AlertTriangle className="w-3 h-3" /> Low stock alert (Threshold: {lowStockThreshold})
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Widget */}
                        <div className="bg-blue-50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 rounded-xl p-5">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-blue-600" />
                                Product Performance
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Sold</p>
                                    <p className="text-xl font-bold mt-1">{currentProduct.total_sold || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Rating</p>
                                    <p className="text-xl font-bold mt-1">{currentProduct.rating || 0}/5</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ViewProductPage;
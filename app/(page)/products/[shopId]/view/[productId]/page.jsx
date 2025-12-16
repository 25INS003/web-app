"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/store/productStore";

// --- Icons ---
import {
    ArrowLeft,
    Loader2,
    Edit,
    Tag,
    DollarSign,
    Package,
    CheckCircle,
    XCircle,
    Ruler,
    Clock,
    Hash,
    Info,
    AlertTriangle,
    TrendingUp,
    Eye,
    Image as ImageIcon,
    Calendar,
    BarChart3
} from "lucide-react";

// --- Shadcn UI ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

// Helper component for displaying a field value
const DisplayField = ({ label, value, icon: Icon, className = "", tooltip = "" }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={`space-y-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${className}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                            {Icon && <Icon className="w-4 h-4 mr-2" />}
                            {label}
                        </div>
                        {tooltip && <Info className="w-3 h-3 text-slate-400" />}
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

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, trend, subtitle, className = "" }) => (
    <Card className={`dark:bg-slate-800/50 dark:border-slate-700 ${className}`}>
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <h3 className="text-2xl font-bold mt-2 dark:text-slate-100">{value}</h3>
                    {subtitle && <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-full ${Icon ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
                    {Icon && <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                </div>
            </div>
            {trend && (
                <div className="flex items-center mt-4 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-medium">{trend}</span>
                </div>
            )}
        </CardContent>
    </Card>
);

const ViewProductPage = () => {
    const params = useParams();
    const router = useRouter();
    const { shopId, productId } = params;

    // --- Store ---
    const {
        currentProduct,
        getProductDetails,
        isLoading
    } = useProductStore();

    // --- Local State ---
    const [isInitializing, setIsInitializing] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState("overview");

    // --- 1. Fetch Data on Mount ---
    useEffect(() => {
        const init = async () => {
            if (shopId && productId) {
                await getProductDetails(shopId, productId);
                setIsInitializing(false);
            }
        };
        init();
    }, [shopId, productId, getProductDetails]);

    // --- Loading State ---
    if (isInitializing || isLoading) {
        return (
            <div className="min-h-full">
                <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
                    <div className="mb-8">
                        <Skeleton className="h-8 w-64 dark:bg-slate-800 mb-2" />
                        <Skeleton className="h-4 w-96 dark:bg-slate-800" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-[400px] rounded-xl dark:bg-slate-800" />
                            <div className="grid grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-24 rounded-lg dark:bg-slate-800" />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-48 rounded-xl dark:bg-slate-800" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Handle case where product is not found after loading
    if (!currentProduct) {
        return (
            <div className="flex-1 w-full flex items-center justify-center p-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold dark:text-slate-100 mb-2">Product Not Found</h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            The product you're looking for doesn't exist or has been removed.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="dark:border-slate-700 dark:text-slate-300"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                        <Button onClick={() => router.push(`/products/${shopId}`)}>
                            Browse Products
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare display values
    const categoryName = currentProduct.category_id?.name || "Uncategorized";
    const price = currentProduct.price || 0;
    const discountedPrice = currentProduct.discounted_price || 0;
    const hasDiscount = discountedPrice > 0;
    const discountPercentage = hasDiscount ? Math.round(((price - discountedPrice) / price) * 100) : 0;

    const stockQuantity = currentProduct.stock_quantity || 0;
    const minStockAlert = currentProduct.min_stock_alert || 0;
    const stockPercentage = minStockAlert > 0 ? Math.min((stockQuantity / (minStockAlert * 2)) * 100, 100) : 0;
    const isLowStock = stockQuantity <= minStockAlert;

    const images = currentProduct.images || [];
    const createdAt = currentProduct.created_at ? new Date(currentProduct.created_at).toLocaleDateString() : "N/A";
    const updatedAt = currentProduct.updated_at ? new Date(currentProduct.updated_at).toLocaleDateString() : "N/A";

    return (
        <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <div className="container mx-auto p-4 lg:p-8 max-w-7xl">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="dark:hover:bg-slate-800/50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight dark:text-slate-100">
                                {currentProduct.name}
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Product ID: {productId} • Last updated: {updatedAt}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={currentProduct.is_available ? "default" : "destructive"} className="gap-2">
                            {currentProduct.is_available ? (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    Available
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-3 h-3" />
                                    Unavailable
                                </>
                            )}
                        </Badge>
                        <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-300">
                            <Tag className="w-3 h-3 mr-1" />
                            {categoryName}
                        </Badge>
                        {hasDiscount && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                {discountPercentage}% OFF
                            </Badge>
                        )}
                        {isLowStock && (
                            <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low Stock
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Image Gallery */}
                        <Card className="dark:bg-slate-800/50 dark:border-slate-700 overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="dark:text-slate-100">Product Gallery</CardTitle>
                                    <Badge variant="outline" className="dark:border-slate-700">
                                        <ImageIcon className="w-3 h-3 mr-1" />
                                        {images.length} images
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {images.length > 0 ? (
                                    <>
                                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-4">
                                            <img
                                                src={images[selectedImage]}
                                                alt={`Product view ${selectedImage + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 gap-3">
                                            {images.map((src, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedImage(index)}
                                                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                                                            ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20"
                                                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                                        }`}
                                                >
                                                    <img
                                                        src={src}
                                                        alt={`Thumbnail ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                                        <ImageIcon className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">No images available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Product Information Tabs */}
                        <Card className="dark:bg-slate-800/50 dark:border-slate-700">
                            <CardContent className="p-6">
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="grid grid-cols-3 mb-6">
                                        <TabsTrigger value="overview" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
                                            Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="inventory" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
                                            Inventory
                                        </TabsTrigger>
                                        <TabsTrigger value="details" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30">
                                            Details
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 dark:text-slate-100">Product Description</h3>
                                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {currentProduct.description || "No description available for this product."}
                                            </p>
                                        </div>

                                        <Separator className="dark:bg-slate-700" />

                                        <div className="grid grid-cols-2 gap-4">
                                            <DisplayField
                                                label="Brand"
                                                value={currentProduct.brand || "N/A"}
                                                icon={Hash}
                                                tooltip="Manufacturer or brand name"
                                            />
                                            <DisplayField
                                                label="SKU"
                                                value={currentProduct.sku || "N/A"}
                                                icon={Hash}
                                                tooltip="Stock Keeping Unit"
                                            />
                                            <DisplayField
                                                label="Created"
                                                value={createdAt}
                                                icon={Calendar}
                                                tooltip="Date when product was added"
                                            />
                                            <DisplayField
                                                label="Last Updated"
                                                value={updatedAt}
                                                icon={Calendar}
                                                tooltip="Date when product was last modified"
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="inventory" className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <StatCard
                                                title="Current Stock"
                                                value={`${stockQuantity} ${currentProduct.unit}`}
                                                icon={Package}
                                                className="col-span-2"
                                            />
                                            <DisplayField
                                                label="Unit"
                                                value={currentProduct.unit}
                                                icon={Ruler}
                                                tooltip="Measurement unit for stock"
                                            />
                                            <DisplayField
                                                label="Min Stock Alert"
                                                value={minStockAlert}
                                                icon={AlertTriangle}
                                                tooltip="Alert when stock reaches this level"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium dark:text-slate-300">Stock Level</span>
                                                <span className="text-sm font-medium dark:text-slate-300">{stockPercentage.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={stockPercentage} className={isLowStock ? "bg-amber-100" : ""} />
                                            <p className={`text-sm ${isLowStock ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
                                                {isLowStock ? "⚠️ Stock is below minimum alert level" : "✓ Stock level is healthy"}
                                            </p>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="details">
                                        <div className="space-y-4">
                                            <DisplayField
                                                label="Product Dimensions"
                                                value={currentProduct.dimensions || "N/A"}
                                                icon={Ruler}
                                                tooltip="Product size measurements"
                                            />
                                            <DisplayField
                                                label="Weight"
                                                value={currentProduct.weight || "N/A"}
                                                icon={Package}
                                                tooltip="Product weight"
                                            />
                                            <DisplayField
                                                label="Additional Notes"
                                                value={currentProduct.notes || "No additional notes"}
                                                icon={Info}
                                                tooltip="Extra product information"
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-8">

                        {/* Pricing Card */}
                        <Card className="dark:bg-slate-800/50 dark:border-slate-700">
                            <CardHeader>
                                <CardTitle className="flex items-center dark:text-slate-100">
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Pricing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">Base Price</span>
                                        <span className="text-xl font-bold dark:text-slate-100">₹{price.toFixed(2)}</span>
                                    </div>
                                    {hasDiscount && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Discounted Price</span>
                                                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                                    ₹{discountedPrice.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t dark:border-slate-700">
                                                <span className="text-slate-600 dark:text-slate-400">Discount Ammount</span>
                                                <span className="font-bold text-green-600 dark:text-green-400">
                                                    ₹{(price - discountedPrice).toFixed(2)} ({discountPercentage}%)
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <Separator className="dark:bg-slate-700" />

                                <div className="flex items-center justify-between text-lg font-bold">
                                    <span>Current Price</span>
                                    <span className="text-2xl text-blue-600 dark:text-blue-400">
                                        ₹{hasDiscount ? discountedPrice.toFixed(2) : price.toFixed(2)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Statistics Card */}
                        {/* <Card className="dark:bg-slate-800/50 dark:border-slate-700">
                            <CardHeader>
                                <CardTitle className="flex items-center dark:text-slate-100">
                                    <BarChart3 className="w-5 h-5 mr-2" />
                                    Statistics
                                </CardTitle>
                                <CardDescription className="dark:text-slate-400">Product performance metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <StatCard
                                    title="Total Views"
                                    value="1,234"
                                    icon={Eye}
                                    trend="+12% this month"
                                    subtitle="Product page views"
                                    className="!bg-transparent !border-0 !p-0 !shadow-none"
                                />
                                <StatCard
                                    title="Monthly Sales"
                                    value="89"
                                    icon={TrendingUp}
                                    trend="+8% from last month"
                                    subtitle="Units sold this month"
                                    className="!bg-transparent !border-0 !p-0 !shadow-none"
                                />
                            </CardContent>
                        </Card> */}

                        {/* Actions Card */}
                        <Card className="dark:bg-slate-800/50 dark:border-slate-700">
                            <CardHeader>
                                <CardTitle className="dark:text-slate-100">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    onClick={() => router.push(`/products/${shopId}/edit/${productId}`)}
                                    className="w-full justify-start"
                                    size="lg"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Product Details
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/products/${shopId}/inventory/${productId}`)}
                                    className="w-full justify-start dark:border-slate-700 dark:text-slate-300"
                                >
                                    <Package className="w-4 h-4 mr-2" />
                                    Update Inventory
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/products`)}
                                    className="w-full justify-start dark:border-slate-700 dark:text-slate-300"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Products
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                            <p>Product ID: {productId}</p>
                            <p>Shop ID: {shopId}</p>
                            <p>Created: {createdAt}</p>
                            <p>Last updated: {updatedAt}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewProductPage;
// app/(page)/products/[shopId]/view/[productId]/page.jsx

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
    Calendar,
    AlertTriangle,
    ImageIcon,
    ShoppingCart
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
import Link from "next/link";

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

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, subtitle, className = "" }) => (
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
        </CardContent>
    </Card>
);

// Variant Card Component
const VariantCard = ({ product, shopId, currentId }) => {
    if (!product || product._id === currentId) return null;

    const hasDiscount = product.discounted_price > 0;
    const discountPercent = hasDiscount 
        ? Math.round(((product.price - product.discounted_price) / product.price) * 100) 
        : 0;

    return (
        <Link href={`/products/${shopId}/view/${product._id}`} className="block group">
            <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 dark:bg-slate-800 dark:border-slate-700">
                <div className="aspect-[4/3] relative bg-slate-100 dark:bg-slate-900">
                    {product.images?.[0] ? (
                        <img 
                            src={product.images[0].url || product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8 opacity-50" />
                        </div>
                    )}
                    {hasDiscount && (
                        <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
                            {discountPercent}% OFF
                        </span>
                    )}
                    {product.stock_quantity <= 0 && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[1px]">
                            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                Out of Stock
                            </span>
                        </div>
                    )}
                </div>
                <CardContent className="p-3">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                         <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-slate-500 border-slate-200 dark:border-slate-700">
                            {product.unit}
                         </Badge>
                         {product.category_id?.name && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                {product.category_id.name}
                            </Badge>
                         )}
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            {hasDiscount && (
                                <p className="text-xs text-slate-500 line-through">₹{product.price}</p>
                            )}
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                                ₹{hasDiscount ? product.discounted_price : product.price}
                            </p>
                        </div>
                        {product.stock_quantity > 0 && (
                            <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                {product.stock_quantity} left
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

const ViewProductPage = () => {
    const params = useParams();
    const router = useRouter();
    const { shopId, productId } = params;

    // --- Store ---
    const {
        currentProduct,
        products: relatedProducts,
        getProductDetails,
        setFilters,
        isLoading
    } = useProductStore();

    // --- Local State ---
    const [isInitializing, setIsInitializing] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState("overview");

    // --- 1. Fetch Main Product Data ---
    useEffect(() => {
        const init = async () => {
            if (shopId && productId) {
                await getProductDetails(shopId, productId);
                setIsInitializing(false);
            }
        };
        init();
    }, [shopId, productId, getProductDetails]);

    // --- 2. Fetch Related Variants (Once main product is loaded) ---
    useEffect(() => {
        if (!isInitializing && currentProduct) {
            const categoryId = typeof currentProduct.category_id === 'object' 
                ? currentProduct.category_id._id 
                : currentProduct.category_id;

            if (categoryId) {
                // Fetch products in same category
                setFilters({ 
                    category_id: categoryId,
                    page: 1, 
                    limit: 8 
                }, shopId);
            }
        }
    }, [isInitializing, currentProduct, setFilters, shopId]);

    // --- Loading State Handling ---
    if (isInitializing) {
        return (
            <div className="min-h-full bg-slate-50 dark:bg-slate-950">
                <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
                    <div className="mb-8">
                        <Skeleton className="h-8 w-64 dark:bg-slate-800 mb-2" />
                        <Skeleton className="h-4 w-96 dark:bg-slate-800" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-[400px] rounded-xl dark:bg-slate-800" />
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-48 rounded-xl dark:bg-slate-800" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentProduct) {
        return (
            <div className="flex-1 w-full flex items-center justify-center p-4 min-h-[60vh]">
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
                    <Button onClick={() => router.push(`/products/${shopId}`)}>
                        Browse Products
                    </Button>
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
        <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
            <div className="container mx-auto p-4 lg:p-8 max-w-7xl">

                {/* --- Top Navigation & Header --- */}
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
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                <span className="font-mono">SKU: {currentProduct.sku || 'N/A'}</span>
                                <span>•</span>
                                <span>Updated: {updatedAt}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={currentProduct.is_available ? "default" : "destructive"} className="gap-2">
                            {currentProduct.is_available ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {currentProduct.is_available ? "Active Listing" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="dark:border-slate-700 dark:text-slate-300">
                            <Tag className="w-3 h-3 mr-1" />
                            {categoryName}
                        </Badge>
                        {hasDiscount && (
                            <Badge className="bg-red-600 hover:bg-red-700 text-white border-none">
                                {discountPercentage}% Sale
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* --- Left Column: Images & Details --- */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Image Gallery */}
                        <Card className="dark:bg-slate-800/50 dark:border-slate-700 overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                                    {/* Thumbnails Sidebar (Desktop) / Bottom (Mobile) */}
                                    <div className="order-2 md:order-1 col-span-1 md:col-span-1 p-2 md:p-4 flex md:flex-col gap-2 overflow-auto bg-slate-50 dark:bg-slate-900/50">
                                        {images.length > 0 ? images.map((src, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedImage(index)}
                                                className={`relative flex-shrink-0 w-16 h-16 md:w-full md:h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                                    : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                                                }`}
                                            >
                                                <img src={src} alt="Thumbnail" className="w-full h-full object-cover" />
                                            </button>
                                        )) : (
                                            <div className="w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg" />
                                        )}
                                    </div>
                                    
                                    {/* Main Image */}
                                    <div className="order-1 md:order-2 col-span-1 md:col-span-4 bg-white dark:bg-slate-900 relative aspect-square md:aspect-auto min-h-[400px]">
                                        {images.length > 0 ? (
                                            <img
                                                src={images[selectedImage]}
                                                alt="Product Main"
                                                className="absolute inset-0 w-full h-full object-contain p-4"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                                                <p>No images uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* --- NEW SECTION: Variants & Related Products --- */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold dark:text-slate-100 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Available Variants
                                </h3>
                                <Badge variant="outline" className="dark:border-slate-700">
                                    Similar items in {categoryName}
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {isLoading && (!relatedProducts || relatedProducts.length === 0) ? (
                                    // Loading Skeletons for Variants
                                    [...Array(4)].map((_, i) => (
                                        <Card key={i} className="dark:bg-slate-800 dark:border-slate-700">
                                            <Skeleton className="aspect-[4/3] rounded-t-lg dark:bg-slate-700" />
                                            <div className="p-3 space-y-2">
                                                <Skeleton className="h-4 w-3/4 dark:bg-slate-700" />
                                                <Skeleton className="h-3 w-1/2 dark:bg-slate-700" />
                                            </div>
                                        </Card>
                                    ))
                                ) : (relatedProducts && relatedProducts.filter(p => p._id !== productId).length > 0) ? (
                                    // Filter out current product and map the rest
                                    relatedProducts
                                        .filter(p => p._id !== productId)
                                        .slice(0, 4)
                                        .map((product) => (
                                            <VariantCard 
                                                key={product._id} 
                                                product={product} 
                                                shopId={shopId} 
                                                currentId={productId} 
                                            />
                                        ))
                                ) : (
                                    // Empty State
                                    <div className="col-span-full p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                                            No other variants found in this category.
                                        </p>
                                        <Button 
                                            variant="link" 
                                            onClick={() => router.push(`/products/${shopId}/add`)}
                                            className="text-blue-600 dark:text-blue-400"
                                        >
                                            + Add a variant
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs for Details */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent dark:border-slate-800">
                                {["Overview", "Inventory", "Attributes"].map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab.toLowerCase()}
                                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none dark:data-[state=active]:text-blue-400"
                                    >
                                        {tab}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="pt-6">
                                <TabsContent value="overview" className="mt-0 space-y-6">
                                    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                                        <p>{currentProduct.description || "No description provided."}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <DisplayField label="Brand" value={currentProduct.brand} icon={Tag} />
                                        <DisplayField label="Category" value={categoryName} icon={Package} />
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="inventory" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <StatCard title="Stock Level" value={`${stockQuantity} ${currentProduct.unit}`} icon={Package} />
                                        <DisplayField label="Low Stock Alert" value={`< ${minStockAlert}`} icon={AlertTriangle} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Capacity</span>
                                            <span>{stockPercentage.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={stockPercentage} className={isLowStock ? "bg-amber-100 [&>div]:bg-amber-500" : ""} />
                                        {isLowStock && <p className="text-xs text-amber-600 font-medium mt-1">Stock is running low!</p>}
                                    </div>
                                </TabsContent>

                                <TabsContent value="attributes" className="mt-0 space-y-4">
                                     {/* Generic attributes display if they existed in schema */}
                                     <div className="grid grid-cols-2 gap-4">
                                        <DisplayField label="Weight" value={currentProduct.weight_kg ? `${currentProduct.weight_kg} kg` : null} icon={Ruler} />
                                        <DisplayField label="Unit Type" value={currentProduct.unit} icon={Package} />
                                        {/* Add more fields here if your schema expands */}
                                     </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* --- Right Column: Pricing & Actions --- */}
                    <div className="space-y-6">
                        <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none border-t-4 border-t-blue-600">
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Selling Price</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                                            ₹{hasDiscount ? discountedPrice.toFixed(2) : price.toFixed(2)}
                                        </span>
                                        <span className="text-sm font-medium text-slate-500">/ {currentProduct.unit}</span>
                                    </div>
                                    {hasDiscount && (
                                        <div className="mt-2 flex items-center gap-2 text-sm">
                                            <span className="text-slate-400 line-through">₹{price.toFixed(2)}</span>
                                            <span className="text-green-600 font-medium">You save ₹{(price - discountedPrice).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <Button
                                        onClick={() => router.push(`/products/${shopId}/edit/${productId}`)}
                                        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                        size="lg"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Product
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push(`/products/${shopId}/inventory/${productId}`)}
                                        className="w-full dark:border-slate-600 dark:text-slate-200"
                                        size="lg"
                                    >
                                        <Package className="w-4 h-4 mr-2" />
                                        Update Stock
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                Sales Summary
                            </h4>
                            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                <div className="flex justify-between">
                                    <span>Total Sold</span>
                                    <span className="font-bold">--</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Revenue</span>
                                    <span className="font-bold">--</span>
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
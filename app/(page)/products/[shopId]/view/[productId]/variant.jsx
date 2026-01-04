"use client";

import React from "react";
import Image from "next/image";
import { 
    MoreHorizontal, 
    AlertCircle, 
    CheckCircle2, 
    Package, 
    Tag,
    Edit,
    Trash2 
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);
};

const VariantList = ({ variants = [], onEdit, onDelete }) => {
    
    if (!variants || variants.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                <Package className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">No Variants Found</h3>
                <p className="text-sm text-slate-500 mt-1">This product currently has no variants listed.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white dark:bg-slate-950 dark:border-slate-800">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>SKU & Attributes</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {variants.map((variant) => {
                        const isLowStock = variant.stock_quantity <= variant.low_stock_threshold;
                        const isOutOfStock = variant.stock_quantity <= 0;
                        const mainImage = variant.images?.[0]?.url || null;

                        return (
                            <TableRow key={variant._id} className="group">
                                {/* --- 1. Image Column --- */}
                                <TableCell>
                                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                                        {mainImage ? (
                                            <Image 
                                                src={mainImage} 
                                                alt={variant.sku}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full text-slate-400">
                                                <Tag className="w-5 h-5 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>

                                {/* --- 2. Identity Column --- */}
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                                {variant.sku || "No SKU"}
                                            </span>
                                            {variant.is_default && (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                                    Default
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        {/* Dynamic Attributes Mapping */}
                                        <div className="flex flex-wrap gap-1">
                                            {variant.attributes && variant.attributes.length > 0 ? (
                                                variant.attributes.map((attr, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                                    >
                                                        {attr.name}: <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">{attr.value}</span>
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">No attributes</span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>

                                {/* --- 3. Price Column --- */}
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{formatPrice(variant.price)}</span>
                                        {variant.compare_at_price > variant.price && (
                                            <span className="text-xs text-slate-400 line-through">
                                                {formatPrice(variant.compare_at_price)}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* --- 4. Stock Column --- */}
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            isOutOfStock ? "bg-red-500" : isLowStock ? "bg-amber-500" : "bg-green-500"
                                        )} />
                                        <span className={cn(
                                            "text-sm font-medium",
                                            isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-slate-600"
                                        )}>
                                            {variant.stock_quantity}
                                        </span>
                                    </div>
                                    {isLowStock && !isOutOfStock && (
                                        <span className="text-[10px] text-amber-600 font-medium block mt-0.5">Low Stock</span>
                                    )}
                                </TableCell>

                                {/* --- 5. Status Column --- */}
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {variant.is_active ? (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-500 bg-slate-50">
                                                Inactive
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>

                                {/* --- 6. Actions Column --- */}
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(variant.sku)}>
                                                Copy SKU
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem >
                                                <Link href={`/variants/${variant.productId}/edit/${variant._id}`}><Edit className="mr-2 h-4 w-4" /> Edit Variant</Link> 
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                onClick={() => onDelete && onDelete(variant._id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default VariantList;
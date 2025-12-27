"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useShopStore } from "@/store/shopStore"; // Adjust path as necessary
import {
    Store,
    Plus,
    Trash2,
    MoreHorizontal,
    Loader2,
    MapPin,
    Phone,
    CheckCircle,
    XCircle,
    Search,
    Building2,
    Settings,
    Edit,
    Mail,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";


// ==========================================
// Main My Shops Page Component
// ==========================================
const MyShopsPage = () => {
    const router = useRouter();
    const { myShops, fetchMyShops, isLoading, error: storeError } = useShopStore();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchMyShops();
    }, [fetchMyShops]);

    const handleEditShop = (shopId) => {
        router.push(`/myshop/edit/${shopId}`);
    };

    // Note: The provided store doesn't have a delete action, 
    // you should add one to the store following the pattern of updateExistingShop
    const handleDeleteShop = async (shopId) => {
        if (!window.confirm("Are you sure you want to delete this shop?")) return;
        // Logic for deletion...
    };

    const filteredShops = myShops.filter(shop =>
        shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeShops = myShops.filter(s => s.status === 'active').length;
    const totalProducts = myShops.reduce((sum, s) => sum + (s.total_products || 0), 0);
    const totalOrders = myShops.reduce((sum, s) => sum + (s.total_orders || 0), 0);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Store className="h-8 w-8" />
                        My Shops
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage all your shops in one place</p>
                </div>
                <Button onClick={() => router.push("/myshop/add")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Shop
                </Button>
            </div>

            {storeError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {storeError}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Shops" value={myShops.length} icon={<Store className="text-blue-500" />} />
                <StatCard title="Active Shops" value={activeShops} icon={<CheckCircle className="text-green-500" />} />
                <StatCard title="Total Products" value={totalProducts} icon={<Building2 className="text-purple-500" />} />
                <StatCard title="Total Orders" value={totalOrders} icon={<CheckCircle className="text-orange-500" />} />
            </div>

            {/* Search Bar */}
            <Card className="bg-white dark:bg-slate-800/60">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search shops by name, category, or city..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
            ) : filteredShops.length === 0 ? (
                <EmptyState onAdd={() => setIsAddDialogOpen(true)} isSearch={!!searchTerm} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredShops.map((shop) => (
                        <ShopCard
                            key={shop._id}
                            shop={shop}
                            onEdit={handleEditShop}
                            onDelete={handleDeleteShop}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Sub-components for cleaner code ---

const StatCard = ({ title, value, icon }) => (
    <Card className="bg-white dark:bg-slate-800/60">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                </div>
                <div className="h-10 w-10">{icon}</div>
            </div>
        </CardContent>
    </Card>
);

const ShopCard = ({ shop, onEdit, onDelete }) => (
    <Card className="bg-white dark:bg-slate-800/60 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Store className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{shop.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">{shop.category}</Badge>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(shop._id)}><Settings className="mr-2 h-4 w-4" /> Edit Shop</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(shop._id)}><Trash2 className="mr-2 h-4 w-4" /> Delete Shop</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {shop.phone || 'No phone'}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {shop.city || 'No location'}</div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
                <Badge className={shop.status === 'active' ? 'bg-green-500' : ''}>
                    {shop.status || 'active'}
                </Badge>
                <Button size="sm" onClick={() => onEdit(shop._id)}><Edit className="h-3 w-3 mr-1" /> Edit</Button>
            </div>
        </CardContent>
    </Card>
);

const EmptyState = ({ onAdd, isSearch }) => (
    <Card className="bg-white dark:bg-slate-800/60">
        <CardContent className="flex flex-col items-center justify-center py-16">
            <Store className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">{isSearch ? "No shops found" : "No shops yet"}</p>
            {!isSearch && <Button onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Add Your First Shop</Button>}
        </CardContent>
    </Card>
);

export default MyShopsPage;
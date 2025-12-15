"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Store, 
    Loader2, 
    Search, 
    CheckCircle, 
    Eye, 
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Users,
    ShieldCheck,
    AlertCircle,
    Clock,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const ShopDetailsDialog = ({ open, onOpenChange, shop }) => {
    if (!shop) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Shop Details
                    </DialogTitle>
                    <DialogDescription>
                        Complete information about the shop
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex items-center gap-4">
                        {shop.image ? (
                            <img
                                src={shop.image}
                                alt={shop.name}
                                className="h-20 w-20 rounded-lg object-cover border-2 border-gray-200"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Store className="h-10 w-10 text-blue-600" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-semibold">{shop.name}</h3>
                            <Badge variant="outline" className="mt-1">{shop.category}</Badge>
                            <Badge 
                                variant={shop.isVerified ? "default" : "secondary"} 
                                className={shop.isVerified ? "bg-green-500 mt-1 ml-2" : "mt-1 ml-2"}
                            >
                                {shop.isVerified ? (
                                    <>
                                        <ShieldCheck className="h-3 w-3 mr-1" />
                                        Verified
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Not Verified
                                    </>
                                )}
                            </Badge>
                        </div>
                    </div>

                    {shop.description && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Description</p>
                            <p className="text-sm">{shop.description}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase">Contact Information</h4>
                            
                            {shop.email && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium">{shop.email}</p>
                                    </div>
                                </div>
                            )}

                            {shop.phone && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm font-medium">{shop.phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase">Location</h4>
                            
                            {shop.address && (
                                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Address</p>
                                        <p className="text-sm font-medium">{shop.address}</p>
                                        {(shop.city || shop.state || shop.pincode) && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {[shop.city, shop.state, shop.pincode].filter(Boolean).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase">Business Hours</h4>
                            
                            {(shop.opening_time || shop.closing_time) && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Operating Hours</p>
                                        <p className="text-sm font-medium">
                                            {shop.opening_time || '09:00'} - {shop.closing_time || '21:00'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase">Additional Information</h4>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Products</p>
                                        <p className="text-sm font-medium">{shop.total_products || 0}</p>
                                    </div>
                                </div>

                                {shop.registeredDate && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Registered</p>
                                            <p className="text-sm font-medium">
                                                {new Date(shop.registeredDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ShopVerificationPage = () => {
    const router = useRouter();
    const [groupedShops, setGroupedShops] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedShop, setSelectedShop] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [verifyingId, setVerifyingId] = useState(null);

    const fetchShops = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/shops/verification');
            if (!response.ok) {
                throw new Error('Failed to fetch shops');
            }
            const data = await response.json();
            setGroupedShops(data.groupedShops || []);
        } catch (error) {
            console.error("Error fetching shops:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const handleVerify = async (shopId) => {
        setVerifyingId(shopId);
        try {
            const response = await fetch(`/api/shops/${shopId}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isVerified: true }),
            });

            if (!response.ok) {
                throw new Error('Failed to verify shop');
            }

            fetchShops();
        } catch (error) {
            console.error("Error verifying shop:", error);
            alert("Failed to verify shop. Please try again.");
        } finally {
            setVerifyingId(null);
        }
    };

    const handleViewDetails = (shop) => {
        setSelectedShop(shop);
        setIsDetailsOpen(true);
    };

    const filteredGroups = groupedShops
        .map(group => ({
            ...group,
            shops: group.shops.filter(shop =>
                shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shop.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shop.city?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }))
        .filter(group => 
            group.shops.length > 0 || 
            group.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const totalShops = groupedShops.reduce((sum, group) => sum + group.shops.length, 0);
    const verifiedShops = groupedShops.reduce((sum, group) => 
        sum + group.shops.filter(s => s.isVerified).length, 0
    );
    const pendingShops = totalShops - verifiedShops;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/verify')}
                        className="mb-2 -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Verification Center
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Store className="h-8 w-8" />
                        Shop Verification
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Review and verify registered shops by owners
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Shops</p>
                                <p className="text-3xl font-bold">{totalShops}</p>
                            </div>
                            <Store className="h-10 w-10 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Verified</p>
                                <p className="text-3xl font-bold text-green-600">{verifiedShops}</p>
                            </div>
                            <ShieldCheck className="h-10 w-10 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-3xl font-bold text-orange-600">{pendingShops}</p>
                            </div>
                            <AlertCircle className="h-10 w-10 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white dark:bg-slate-800/60">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search shops by name, category, city, or owner..."
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
            ) : filteredGroups.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Store className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-xl font-semibold mb-2">
                            {searchTerm ? "No shops found" : "No shops registered yet"}
                        </p>
                        <p className="text-muted-foreground">
                            {searchTerm ? "Try adjusting your search" : "Shops will appear here once they are registered"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {filteredGroups.map((group) => (
                        <Card key={group.owner._id} className="bg-white dark:bg-slate-800/60">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800/80">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{group.owner.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                {group.shops.length} Shop{group.shops.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    {group.owner.email && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            <span>{group.owner.email}</span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {group.shops.map((shop) => (
                                        <Card key={shop._id} className="bg-slate-50 dark:bg-slate-800/60 hover:shadow-md transition-shadow">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start gap-3">
                                                    {shop.image ? (
                                                        <img
                                                            src={shop.image}
                                                            alt={shop.name}
                                                            className="h-12 w-12 rounded-lg object-cover border-2 border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                                            <Store className="h-6 w-6 text-blue-600" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <CardTitle className="text-base truncate">{shop.name}</CardTitle>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">{shop.category}</Badge>
                                                            <Badge 
                                                                variant={shop.isVerified ? "default" : "secondary"}
                                                                className={shop.isVerified ? "bg-green-500 text-xs" : "text-xs"}
                                                            >
                                                                {shop.isVerified ? (
                                                                    <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                                                                ) : (
                                                                    <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                                                )}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="space-y-1.5 text-sm">
                                                    {shop.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-xs">{shop.phone}</span>
                                                        </div>
                                                    )}
                                                    {shop.city && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-xs truncate">{shop.city}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2 pt-2 border-t">
                                                    {!shop.isVerified && (
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs"
                                                            onClick={() => handleVerify(shop._id)}
                                                            disabled={verifyingId === shop._id}
                                                        >
                                                            {verifyingId === shop._id ? (
                                                                <>
                                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                    Verifying...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Verify
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className={`h-8 text-xs ${shop.isVerified ? 'flex-1' : 'flex-1'}`}
                                                        onClick={() => handleViewDetails(shop)}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Details
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <ShopDetailsDialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                shop={selectedShop}
            />
        </div>
    );
};

export default ShopVerificationPage;
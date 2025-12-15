"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Users, 
    Loader2, 
    Search, 
    CheckCircle, 
    Eye, 
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Store,
    ShieldCheck,
    AlertCircle
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

const OwnerDetailsDialog = ({ open, onOpenChange, owner }) => {
    if (!owner) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Owner Details
                    </DialogTitle>
                    <DialogDescription>
                        Complete information about the shop owner
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">{owner.name}</h3>
                            <Badge variant={owner.isVerified ? "default" : "secondary"} className={owner.isVerified ? "bg-green-500" : ""}>
                                {owner.isVerified ? (
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

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase">Contact Information</h4>
                            
                            {owner.email && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium">{owner.email}</p>
                                    </div>
                                </div>
                            )}

                            {owner.phone && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm font-medium">{owner.phone}</p>
                                    </div>
                                </div>
                            )}

                            {owner.address && (
                                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Address</p>
                                        <p className="text-sm font-medium">{owner.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase">Business Information</h4>
                            
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <Store className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Shops</p>
                                    <p className="text-sm font-medium">{owner.totalShops || 0}</p>
                                </div>
                            </div>

                            {owner.registeredDate && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Registered Date</p>
                                        <p className="text-sm font-medium">
                                            {new Date(owner.registeredDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const OwnerVerificationPage = () => {
    const router = useRouter();
    const [owners, setOwners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [verifyingId, setVerifyingId] = useState(null);

    const fetchOwners = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/owners');
            if (!response.ok) {
                throw new Error('Failed to fetch owners');
            }
            const data = await response.json();
            setOwners(data.owners || []);
        } catch (error) {
            console.error("Error fetching owners:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOwners();
    }, []);

    const handleVerify = async (ownerId) => {
        setVerifyingId(ownerId);
        try {
            const response = await fetch(`/api/owners/${ownerId}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isVerified: true }),
            });

            if (!response.ok) {
                throw new Error('Failed to verify owner');
            }

            fetchOwners();
        } catch (error) {
            console.error("Error verifying owner:", error);
            alert("Failed to verify owner. Please try again.");
        } finally {
            setVerifyingId(null);
        }
    };

    const handleViewDetails = (owner) => {
        setSelectedOwner(owner);
        setIsDetailsOpen(true);
    };

    const filteredOwners = owners.filter(owner =>
        owner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const verifiedCount = owners.filter(o => o.isVerified).length;
    const pendingCount = owners.filter(o => !o.isVerified).length;

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
                        <Users className="h-8 w-8" />
                        Owner Verification
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Review and verify registered shop owners
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Owners</p>
                                <p className="text-3xl font-bold">{owners.length}</p>
                            </div>
                            <Users className="h-10 w-10 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Verified</p>
                                <p className="text-3xl font-bold text-green-600">{verifiedCount}</p>
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
                                <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
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
                            placeholder="Search owners by name, email, or phone..."
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
            ) : filteredOwners.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800/60">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Users className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-xl font-semibold mb-2">
                            {searchTerm ? "No owners found" : "No owners registered yet"}
                        </p>
                        <p className="text-muted-foreground">
                            {searchTerm ? "Try adjusting your search" : "Owners will appear here once they register"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOwners.map((owner) => (
                        <Card key={owner._id} className="bg-white dark:bg-slate-800/60 hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Users className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{owner.name}</CardTitle>
                                            <Badge 
                                                variant={owner.isVerified ? "default" : "secondary"}
                                                className={owner.isVerified ? "bg-green-500 mt-1" : "mt-1"}
                                            >
                                                {owner.isVerified ? (
                                                    <>
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Verified
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                        Pending
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    {owner.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate">{owner.email}</span>
                                        </div>
                                    )}
                                    {owner.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{owner.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Store className="h-4 w-4 text-muted-foreground" />
                                        <span>{owner.totalShops || 0} Shop{owner.totalShops !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-3 border-t">
                                    {!owner.isVerified && (
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleVerify(owner._id)}
                                            disabled={verifyingId === owner._id}
                                        >
                                            {verifyingId === owner._id ? (
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
                                        className={owner.isVerified ? "flex-1" : "flex-1"}
                                        onClick={() => handleViewDetails(owner)}
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <OwnerDetailsDialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                owner={selectedOwner}
            />
        </div>
    );
};

export default OwnerVerificationPage;
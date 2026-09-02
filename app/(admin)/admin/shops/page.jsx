"use client";

import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminShopStore } from "@/store/adminShopStore";
import { 
    Store, 
    Search, 
    Filter, 
    CheckCircle, 
    XCircle, 
    MoreHorizontal, 
    MapPin,
    Eye,
    AlertCircle,
    Building2,
    Mail,
    Phone,
    Package,
    PackagePlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; 
import { toast } from "sonner";
import { motion } from "framer-motion"; 

import { ShopDetailsDialog } from "./components/ShopDetailsDialog";

export default function AdminShopsPage() {
    const router = useRouter();
    const { shops, fetchAllShops, updateShopStatus, isLoading } = useAdminShopStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); 
    
    // Approval/Rejection Dialog State
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [selectedActionShop, setSelectedActionShop] = useState(null);
    const [actionType, setActionType] = useState(null); 
    const [rejectionReason, setRejectionReason] = useState("");

    // Details Dialog State
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);

    useEffect(() => {
        fetchAllShops();
    }, [fetchAllShops]);

    const filteredShops = shops.filter(shop => {
        const ownerName = `${shop.owner_id?.user_id?.first_name || ""} ${shop.owner_id?.user_id?.last_name || ""}`.trim();
        const matchesSearch = shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              shop.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              ownerName.toLowerCase().includes(searchTerm.toLowerCase());
                              
        let matchesStatus = true;
        if (statusFilter !== "all") {
             if (statusFilter === 'approved') matchesStatus = shop.shop_status === 'active';
             else if (statusFilter === 'rejected') matchesStatus = shop.shop_status === 'inactive' || shop.shop_status === 'suspended';
             else matchesStatus = shop.shop_status === statusFilter;
        }

        return matchesSearch && matchesStatus;
    });

    const handleActionClick = (shop, type) => {
        setSelectedActionShop(shop);
        setActionType(type);
        setRejectionReason("");
        setActionDialogOpen(true);
    };

    const confirmAction = async () => {
        if (!selectedActionShop || !actionType) return;

        const success = await updateShopStatus(selectedActionShop.id, actionType, rejectionReason);
        
        if (success) {
            toast.success(`Shop ${actionType === 'active' ? 'approved' : 'rejected'} successfully`);
            setActionDialogOpen(false);
        } else {
            toast.error("Failed to update shop status");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 min-h-[calc(100vh-100px)] pb-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                         <div className="p-2 rounded-xl bg-primary/10 border border-primary/30">
                            <Store className="h-6 w-6 text-primary" />
                         </div>
                         Shops Directory
                    </h1>
                    <p className="text-muted-foreground mt-2 ml-1">
                        Monitor and manage all registered shops on the platform.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border shadow-lg"
            >
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                        placeholder="Search by shop name or owner..." 
                        className="pl-10 bg-card border-border focus:ring-ring"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                        <select 
                            className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none appearance-none cursor-pointer hover:bg-muted dark:hover:bg-muted/50 transition-colors"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ backgroundImage: 'none' }} // Remove default arrow if needed or keep standard
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Shops Table */}
            <motion.div 
                variants={itemVariants}
                className="bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/50 dark:bg-popover/50 border-b border-border">
                            <tr>
                                <th className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Shop Name</th>
                                <th className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Owner</th>
                                <th className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Location</th>
                                <th className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                                <th className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr><td colSpan="5" className="p-12 text-center text-muted-foreground">Loading shops...</td></tr>
                            ) : filteredShops.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center text-muted-foreground">No shops found matching your filters.</td></tr>
                            ) : (
                                filteredShops.map((shop) => (
                                    <tr key={shop.id} className="group hover:bg-muted/50 transition-colors duration-200">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border transition-colors">
                                                    {shop.logo_url ? (
                                                        <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Store className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{shop.name || shop.shop_name || "Unnamed Shop"}</p>
                                                    <p className="text-xs text-muted-foreground">{shop.category || "General Store"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground text-sm">
                                                    {shop.owner_id?.user_id?.first_name} {shop.owner_id?.user_id?.last_name}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Mail className="w-3 h-3" />
                                                    {shop.owner_id?.user_id?.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="truncate max-w-[150px]">{shop.address?.city || shop.city || "Location N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge className={`
                                                capitalize font-medium shadow-sm border
                                                ${shop.shop_status === 'active' ? 'bg-success/10 text-success border-success/20' : ''}
                                                ${shop.shop_status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' : ''}
                                                ${(shop.shop_status === 'inactive' || shop.shop_status === 'suspended') ? ' text-destructive border-destructive/30/20' : ''}
                                            `}>
                                                {shop.shop_status === 'active' ? 'Approved' : shop.shop_status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted transition-colors">
                                                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-border bg-card/95 dark:bg-popover/95 backdrop-blur-md">
                                                    <DropdownMenuItem 
                                                        className="cursor-pointer gap-2 py-2.5"
                                                        onClick={() => {
                                                            setSelectedShop(shop);
                                                            setDetailsOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 text-muted-foreground" /> 
                                                        View Details
                                                    </DropdownMenuItem>

                                                    {/* Offered for every shop, whatever its status:
                                                        seeing what a shop stocks is part of deciding
                                                        whether to approve it. */}
                                                    <DropdownMenuItem
                                                        className="cursor-pointer gap-2 py-2.5"
                                                        onClick={() => router.push(`/admin/shops/${shop.id}/products`)}
                                                    >
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        View products
                                                    </DropdownMenuItem>

                                                    {/* The API has always allowed an admin to add a
                                                        product to any shop; there was simply no way
                                                        to ask for it. Offered only for a live shop —
                                                        stocking one that is pending or rejected
                                                        would be building on a decision not yet
                                                        made. */}
                                                    {shop.shop_status === 'active' && (
                                                        <DropdownMenuItem
                                                            className="cursor-pointer gap-2 py-2.5"
                                                            onClick={() => router.push(`/admin/shops/${shop.id}/products/add`)}
                                                        >
                                                            <PackagePlus className="h-4 w-4 text-muted-foreground" />
                                                            Add product
                                                        </DropdownMenuItem>
                                                    )}
                                                    
                                                    {shop.shop_status === 'pending' && (
                                                        <>
                                                            <div className="h-px my-1 bg-muted" />
                                                            <DropdownMenuItem 
                                                                className="text-success focus:text-success dark:focus:text-success focus:bg-success/10 dark:focus:bg-success/10 cursor-pointer gap-2 py-2.5"
                                                                onClick={() => handleActionClick(shop, 'active')}
                                                            >
                                                                <CheckCircle className="h-4 w-4" /> Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className="text-destructive focus:text-destructive dark:focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2 py-2.5"
                                                                onClick={() => handleActionClick(shop, 'inactive')}
                                                            >
                                                                <XCircle className="h-4 w-4" /> Reject
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Action Dialog */}
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent className="rounded-2xl sm:max-w-md bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {actionType === 'active' ? (
                                <div className="p-2 rounded-full dark:bg-success/20 text-success">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                            ) : (
                                <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                            )}
                            {actionType === 'active' ? 'Approve Shop' : 'Reject Shop'}
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to {actionType === 'active' ? 'approve' : 'reject'} <span className="font-semibold text-foreground">{selectedActionShop?.name || selectedActionShop?.shop_name}</span>?
                        </DialogDescription>
                    </DialogHeader>

                    {actionType === 'inactive' && (
                        <div className="py-2">
                            <label className="text-sm font-medium mb-1.5 block text-foreground">Rejection Reason</label>
                            <Textarea 
                                placeholder="Please provide a reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="resize-none bg-muted border-border focus:ring-destructive"
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="ghost" onClick={() => setActionDialogOpen(false)} className="rounded-xl hover:bg-muted">
                            Cancel
                        </Button>
                        <Button 
                            className={`rounded-xl shadow-lg ${
                                actionType === 'active' 
                                    ? 'bg-success hover:bg-success/90 text-white' 
                                    : 'bg-destructive hover:bg-destructive/90 text-white shadow-destructive/20'
                            }`}
                            onClick={confirmAction}
                        >
                            Confirm {actionType === 'active' ? 'Approval' : 'Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Shop Details Dialog */}
            <ShopDetailsDialog 
                open={detailsOpen} 
                onOpenChange={setDetailsOpen} 
                shop={selectedShop} 
            />
        </motion.div>
    );
}

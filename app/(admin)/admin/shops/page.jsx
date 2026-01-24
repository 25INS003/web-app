"use client";

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
    Phone
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

        const success = await updateShopStatus(selectedActionShop._id, actionType, rejectionReason);
        
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
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                         <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <Store className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                         </div>
                         Shops Directory
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 ml-1">
                        Monitor and manage all registered shops on the platform.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg"
            >
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input 
                        placeholder="Search by shop name or owner..." 
                        className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-purple-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                        <select 
                            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none appearance-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
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
                className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Shop Name</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Owner</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Location</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan="5" className="p-12 text-center text-slate-500">Loading shops...</td></tr>
                            ) : filteredShops.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center text-slate-500">No shops found matching your filters.</td></tr>
                            ) : (
                                filteredShops.map((shop) => (
                                    <tr key={shop._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 group-hover:border-purple-500/30 transition-colors">
                                                    {shop.logo_url ? (
                                                        <img src={shop.logo_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Store className="h-5 w-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{shop.name || shop.shop_name || "Unnamed Shop"}</p>
                                                    <p className="text-xs text-slate-500">{shop.category || "General Store"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">
                                                    {shop.owner_id?.user_id?.first_name} {shop.owner_id?.user_id?.last_name}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Mail className="w-3 h-3" />
                                                    {shop.owner_id?.user_id?.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="truncate max-w-[150px]">{shop.address?.city || shop.city || "Location N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge className={`
                                                capitalize font-medium shadow-sm border
                                                ${shop.shop_status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : ''}
                                                ${shop.shop_status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : ''}
                                                ${(shop.shop_status === 'inactive' || shop.shop_status === 'suspended') ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : ''}
                                            `}>
                                                {shop.shop_status === 'active' ? 'Approved' : shop.shop_status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                                                    <DropdownMenuItem 
                                                        className="cursor-pointer gap-2 py-2.5"
                                                        onClick={() => {
                                                            setSelectedShop(shop);
                                                            setDetailsOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 text-slate-500" /> 
                                                        View Details
                                                    </DropdownMenuItem>
                                                    
                                                    {shop.shop_status === 'pending' && (
                                                        <>
                                                            <div className="h-px my-1 bg-slate-100 dark:bg-slate-800" />
                                                            <DropdownMenuItem 
                                                                className="text-emerald-600 focus:text-emerald-700 dark:focus:text-emerald-400 focus:bg-emerald-50 dark:focus:bg-emerald-500/10 cursor-pointer gap-2 py-2.5"
                                                                onClick={() => handleActionClick(shop, 'active')}
                                                            >
                                                                <CheckCircle className="h-4 w-4" /> Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className="text-red-600 focus:text-red-700 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10 cursor-pointer gap-2 py-2.5"
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
                <DialogContent className="rounded-2xl sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {actionType === 'active' ? (
                                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                            ) : (
                                <div className="p-2 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                            )}
                            {actionType === 'active' ? 'Approve Shop' : 'Reject Shop'}
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to {actionType === 'active' ? 'approve' : 'reject'} <span className="font-semibold text-slate-900 dark:text-slate-50">{selectedActionShop?.name || selectedActionShop?.shop_name}</span>?
                        </DialogDescription>
                    </DialogHeader>

                    {actionType === 'inactive' && (
                        <div className="py-2">
                            <label className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">Rejection Reason</label>
                            <Textarea 
                                placeholder="Please provide a reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="resize-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-red-500"
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="ghost" onClick={() => setActionDialogOpen(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            Cancel
                        </Button>
                        <Button 
                            className={`rounded-xl shadow-lg shadow-emerald-500/20 ${
                                actionType === 'active' 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
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

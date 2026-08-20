"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useShopOwnerStore } from "@/store/adminShopownerStore";
import { 
    Eye, 
    CheckCircle, 
    ShieldCheck, 
    RefreshCcw, 
    MapPin, 
    Building2,
    Users,
    Fingerprint,
    Search,
    XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ShopOwnerListPage() {
    const { shopOwners, isLoading, fetchAllOwners, approveOwner, rejectOwner, verifyOwner } = useShopOwnerStore();
    const [searchTerm, setSearchTerm] = useState("");
    // ?status=pending — what the dashboard's approval card links to. Kept in
    // the URL rather than in component state so the link is shareable and the
    // back button behaves.
    const searchParams = useSearchParams();
    const [pendingOnly, setPendingOnly] = useState(
        searchParams.get("status") === "pending"
    );

    useEffect(() => {
        fetchAllOwners();
    }, [fetchAllOwners]);

    // Filter logic
    // The API's populated `user_id` carries first_name and last_name — there is
    // no `full_name`. Reading one meant every row rendered "Unknown" and the
    // search below silently matched nothing, which looks like "no results"
    // rather than like a bug.
    const ownerName = (owner) =>
        [owner?.user_id?.first_name, owner?.user_id?.last_name]
            .filter(Boolean)
            .join(" ")
            .trim();

    // Registration writes "New Enterprise" as a placeholder before the
    // applicant has filled in any business details, so the pending queue — the
    // one screen where these rows matter most — showed a column of identical
    // bold headings that read like branches of one chain. The row falls back
    // to the person's name, which is the part an admin can actually act on.
    const PLACEHOLDER_BUSINESS = "New Enterprise";
    const businessLabel = (owner) => {
        const name = owner?.business_name?.trim();
        if (name && name !== PLACEHOLDER_BUSINESS) return name;
        return ownerName(owner) || "Applicant";
    };
    const hasBusinessDetails = (owner) => {
        const name = owner?.business_name?.trim();
        return Boolean(name) && name !== PLACEHOLDER_BUSINESS;
    };

    const filteredOwners = shopOwners
        .filter(owner => !pendingOnly || !owner.is_approved)
        .filter(owner =>
            owner.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ownerName(owner).toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.gst_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const pendingCount = shopOwners.filter(o => !o.is_approved).length;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const rowVariants = {
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
            className="space-y-8 min-h-[calc(100vh-100px)] pb-20"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                         <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                         </div>
                         Shop Owners
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg ml-1">
                        Manage business verifications and approve new partners.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <Input 
                            placeholder="Search by name, business, GST..." 
                            className="pl-10 w-full sm:w-[300px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* The queue, made visible. Without a control the filter is
                        invisible state: an admin arriving from the dashboard
                        link sees a short list and no reason for it. */}
                    <Button
                        onClick={() => setPendingOnly((v) => !v)}
                        variant={pendingOnly ? "default" : "outline"}
                        className="gap-2"
                    >
                        Pending only
                        <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                            pendingCount > 0
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                        }`}>
                            {pendingCount}
                        </span>
                    </Button>
                    <Button
                        onClick={() => fetchAllOwners()}
                        variant="outline"
                        className="gap-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
                    >
                        <RefreshCcw size={16} className={`${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Shop Owners Table */}
            <motion.div 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="p-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Business Details</th>
                                <th className="p-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">GST / Tax ID</th>
                                <th className="p-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Location</th>
                                <th className="p-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                                <th className="p-6 font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                                            <span>Loading shop owners...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOwners.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                                                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-900 dark:text-white">No shop owners found</p>
                                            <p className="text-sm">Try adjusting your search terms.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence>
                                    {filteredOwners.map((owner, index) => (
                                        <motion.tr 
                                            key={owner.id} 
                                            variants={rowVariants}
                                            initial="hidden"
                                            animate="visible"
                                            transition={{ delay: index * 0.05 }}
                                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors duration-200"
                                        >
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        <Building2 size={18} className="text-slate-400 group-hover:text-blue-500" />
                                                        {businessLabel(owner)}
                                                    </span>
                                                    <span className="text-xs text-slate-500 ml-7 flex items-center gap-1">
                                                        {hasBusinessDetails(owner) ? (
                                                            <>Owner: <span className="font-medium text-slate-700 dark:text-slate-300">{ownerName(owner) || "Unknown"}</span></>
                                                        ) : (
                                                            <span className="italic text-slate-400">Business details not provided yet</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                                                    <Fingerprint size={12} className="text-slate-400" />
                                                    {owner.gst_number || <span className="text-slate-400 italic">Not Provided</span>}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <div className="p-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
                                                        <MapPin size={14} />
                                                    </div>
                                                    {owner.business_address_district}, {owner.business_address_state}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <Badge className={`
                                                    capitalize font-medium shadow-sm border px-3 py-1 rounded-full
                                                    ${owner.is_approved
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                                    }
                                                `}>
                                                    {owner.is_approved ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                            Pending Review
                                                        </span>
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <TooltipProvider delayDuration={0}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Link href={`/admin/shop-owners/${owner.id}`}>
                                                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl">
                                                                        <Eye size={18} />
                                                                    </Button>
                                                                </Link>
                                                            </TooltipTrigger>
                                                            <TooltipContent>View Details</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    {!owner.is_approved && (
                                                        <>
                                                            <TooltipProvider delayDuration={0}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button 
                                                                            size="icon" 
                                                                            variant="ghost" 
                                                                            onClick={() => approveOwner(owner.id)}
                                                                            className="h-9 w-9 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl"
                                                                        >
                                                                            <CheckCircle size={18} />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Approve Owner</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            <TooltipProvider delayDuration={0}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button 
                                                                            size="icon" 
                                                                            variant="ghost" 
                                                                            onClick={() => rejectOwner(owner.id)}
                                                                            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                                                        >
                                                                            <XCircle className="h-[18px] w-[18px]" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Reject Application</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </>
                                                    )}

                                                    <TooltipProvider delayDuration={0}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    size="icon" 
                                                                    variant="ghost" 
                                                                    onClick={() => verifyOwner(owner.id)}
                                                                    className="h-9 w-9 text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl"
                                                                >
                                                                    <ShieldCheck size={18} />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Verify Documents</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
}

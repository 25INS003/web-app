"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

/**
 * What each verification state looks like in the list.
 *
 * Four states, not two. `is_approved` is a boolean and cannot tell a rejected
 * owner from one still waiting — which is exactly how a rejected application
 * went on displaying "Pending Review" to the admin who had just rejected it.
 *
 * The wording matches the detail page so one owner reads the same on both
 * screens.
 */
const OWNER_STATES = {
    approved: {
        label: "Verified",
        className: "bg-success/10 text-success border-success/20",
        dot: "bg-success animate-pulse",
    },
    rejected: {
        label: "Rejected",
        className: "bg-destructive/10 text-destructive border-destructive/20",
        dot: "bg-destructive",
    },
    revoked: {
        label: "Revoked",
        className: "bg-destructive/10 text-destructive border-destructive/20",
        dot: "bg-destructive",
    },
    // `draft` is an application still being filled in; `pending` is one
    // submitted and waiting. Both are "not yet decided" to an admin scanning
    // the list, and the queue column already separates them.
    pending: {
        label: "Pending Review",
        className: "bg-warning/10 text-warning border-warning/20",
        dot: "bg-warning",
    },
    draft: {
        label: "Not submitted",
        className: "bg-muted text-muted-foreground border-border",
        dot: "bg-muted-foreground",
    },
};

export default function ShopOwnerListPage() {
    const { shopOwners, isLoading, fetchAllOwners, approveOwner } = useShopOwnerStore();
    const [searchTerm, setSearchTerm] = useState("");
    // ?status=pending — what the dashboard's approval card links to.
    //
    // Read FROM the url on every render rather than copied into state once.
    // It used to seed a `useState` and never write back, so the comment here
    // claiming the back button behaved was simply untrue: turning the filter
    // off left `?status=pending` in the address bar, so Back walked off the
    // page instead of undoing the filter, and a refresh silently re-applied
    // it. One source of truth fixes all three at once — Back, refresh, and a
    // shared link.
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const pendingOnly = searchParams.get("status") === "pending";

    const setPendingOnly = (next) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next) params.set("status", "pending");
        else params.delete("status");
        const query = params.toString();
        // `push`, not `replace`: turning the filter on is a place the admin
        // navigated to, and Back is how they expect to leave it.
        router.push(query ? `${pathname}?${query}` : pathname);
    };

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
    // Everyone the pending filter is keeping off screen.
    const hiddenCount = shopOwners.length - pendingCount;

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
                    <h1 className="text-4xl font-bold text-foreground flex items-center gap-3 tracking-tight">
                         <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                            <Users className="h-8 w-8 text-primary" />
                         </div>
                         Shop Owners
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg ml-1">
                        Manage business verifications and approve new partners.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <Input 
                            placeholder="Search by name, business, GST..." 
                            className="pl-10 w-full sm:w-[300px] bg-card border-border focus:ring-2 focus:ring-ring"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* The queue, made visible. Without a control the filter is
                        invisible state: an admin arriving from the dashboard
                        link sees a short list and no reason for it. */}
                    {/* `aria-pressed` because this is a toggle, not a link:
                        a screen reader otherwise announces "Pending only"
                        identically whether the list is filtered or not. */}
                    <Button
                        onClick={() => setPendingOnly(!pendingOnly)}
                        variant={pendingOnly ? "default" : "outline"}
                        aria-pressed={pendingOnly}
                        className="gap-2"
                    >
                        {/* Says what pressing it DOES once it is on. "Pending
                            only" while already filtered reads as a label for
                            the state, not as the way out of it — which is why
                            a filtered list looked like one with no way back. */}
                        {pendingOnly ? "Showing pending — show all" : "Pending only"}
                        <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                            pendingCount > 0
                                ? "bg-warning/15 text-warning"
                                : "bg-muted text-muted-foreground"
                        }`}>
                            {pendingCount}
                        </span>
                    </Button>
                    <Button
                        onClick={() => fetchAllOwners()}
                        variant="outline"
                        className="gap-2 bg-card border-border hover:bg-muted dark:hover:bg-muted shadow-sm"
                    >
                        <RefreshCcw size={16} className={`${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* What the filter is hiding, and one click to see it.
                
                The dashboard's "Shop owners awaiting approval" card links
                here with ?status=pending, so an admin who clicks it watches
                every approved owner vanish from a page titled "Shop Owners"
                — with nothing saying they still exist. Counting them is the
                honest version: the queue is still what you came for, and the
                rest are one click away. */}
            {pendingOnly && hiddenCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-5 py-3">
                    <p className="text-sm text-muted-foreground">
                        Showing the{" "}
                        <span className="font-medium text-foreground">{pendingCount}</span>{" "}
                        awaiting approval.{" "}
                        <span className="font-medium text-foreground">{hiddenCount}</span>{" "}
                        approved {hiddenCount === 1 ? "owner is" : "owners are"} hidden.
                    </p>
                    <Button
                        onClick={() => setPendingOnly(false)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                    >
                        Show all {shopOwners.length}
                    </Button>
                </div>
            )}

            {/* Shop Owners Table */}
            <motion.div 
                className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <th className="p-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Business Details</th>
                                <th className="p-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">GST / Tax ID</th>
                                <th className="p-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Location</th>
                                <th className="p-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                                <th className="p-6 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
                                            <span>Loading shop owners...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOwners.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 rounded-full bg-muted">
                                                <Users className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            {/* "No shop owners found" is untrue when a
                                                filter is the reason the list is empty —
                                                and an empty queue is good news, not a
                                                failed search. Say which it is. */}
                                            {pendingOnly && pendingCount === 0 ? (
                                                <>
                                                    <p className="text-lg font-medium text-foreground">Nothing waiting for approval</p>
                                                    <p className="text-sm">Every application has been reviewed.</p>
                                                    {shopOwners.length > 0 && (
                                                        <Button
                                                            onClick={() => setPendingOnly(false)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-1"
                                                        >
                                                            Show all {shopOwners.length}
                                                        </Button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-lg font-medium text-foreground">No shop owners found</p>
                                                    <p className="text-sm">Try adjusting your search terms.</p>
                                                </>
                                            )}
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
                                            className="group hover:bg-muted/80 dark:hover:bg-popover/30 transition-colors duration-200"
                                        >
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="font-bold text-foreground text-base flex items-center gap-2 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                                                        <Building2 size={18} className="text-muted-foreground group-hover:text-primary" />
                                                        {businessLabel(owner)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground ml-7 flex items-center gap-1">
                                                        {hasBusinessDetails(owner) ? (
                                                            <>Owner: <span className="font-medium text-foreground">{ownerName(owner) || "Unknown"}</span></>
                                                        ) : (
                                                            <span className="italic text-muted-foreground">Business details not provided yet</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted px-3 py-1.5 rounded-lg w-fit border border-border">
                                                    <Fingerprint size={12} className="text-muted-foreground" />
                                                    {owner.gst_number || <span className="text-muted-foreground italic">Not Provided</span>}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <div className="p-1.5 rounded-full">
                                                        <MapPin size={14} />
                                                    </div>
                                                    {owner.business_address_district}, {owner.business_address_state}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                {/* Read from `verification_status`, not from `is_approved`.
                                                    The boolean has only two values and there are four
                                                    states: a rejected owner and a revoked one are both
                                                    `is_approved: false`, so both used to render as
                                                    "Pending Review" — an admin who had just rejected
                                                    somebody was told the application was still waiting
                                                    for them. Same vocabulary the detail page uses. */}
                                                {(() => {
                                                    const state = OWNER_STATES[owner.verification_status] ??
                                                        (owner.is_approved ? OWNER_STATES.approved : OWNER_STATES.pending);
                                                    return (
                                                        <Badge className={`capitalize font-medium shadow-sm border px-3 py-1 rounded-full ${state.className}`}>
                                                            <span className="flex items-center gap-1.5">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${state.dot}`}></span>
                                                                {state.label}
                                                            </span>
                                                        </Badge>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {/* "View Details" used to sit here, pointing at the
                                                        same /admin/shop-owners/:id as "Review application"
                                                        below — two buttons, one destination. The other one
                                                        stays because its tooltip carries the document
                                                        count, which is the thing worth knowing before
                                                        clicking into a review. */}
                                                    {!owner.is_approved && (
                                                        <>
                                                            <TooltipProvider delayDuration={0}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button 
                                                                            size="icon" 
                                                                            variant="ghost" 
                                                                            onClick={() => approveOwner(owner.id)}
                                                                            className="h-9 w-9 text-success hover:text-success hover:bg-success/10 rounded-xl"
                                                                        >
                                                                            <CheckCircle size={18} />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Approve Owner</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            {/* Rejecting needs a written reason — the owner is
                                                                shown it — and a table row is no place to write
                                                                one. This links to the review screen, which has
                                                                the business details on screen beside the box.
                                                                Approve stays a click: it asks nothing of the
                                                                person being approved. */}
                                                            <TooltipProvider delayDuration={0}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link
                                                                            href={`/admin/shop-owners/${owner.id}`}
                                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-destructive transition hover:bg-destructive/10 dark:hover:bg-destructive/20"
                                                                        >
                                                                            <XCircle className="h-[18px] w-[18px]" />
                                                                        </Link>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Reject — opens the review screen to give a reason</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </>
                                                    )}

<TooltipProvider delayDuration={0}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Link
                                                                    href={`/admin/shop-owners/${owner.id}`}
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-primary transition hover:bg-primary/10 hover:text-primary"
                                                                >
                                                                    <ShieldCheck size={18} />
                                                                </Link>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Review application{owner.document_count ? ` (${owner.document_count} document${owner.document_count === 1 ? "" : "s"})` : " — no documents"}
                                                            </TooltipContent>
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

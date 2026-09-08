"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
    PackagePlus,
    Pencil,
    Trash2
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

/**
 * What an admin can do to a shop, and what each one is called.
 *
 * `actionType` used to BE the target status, which worked only while there
 * were two actions and they had two statuses. Taking a live shop offline
 * writes the same `inactive` as rejecting a pending one, and the two are not
 * the same decision to make or to be told about — so the key is the action and
 * the status is a property of it.
 */
const SHOP_ACTIONS = {
    approve: {
        status: "active",
        title: "Approve shop",
        question: "approve",
        confirm: "Confirm approval",
        past: "approved",
        destructive: false,
    },
    reject: {
        status: "inactive",
        title: "Reject shop",
        question: "reject",
        confirm: "Confirm rejection",
        past: "rejected",
        destructive: true,
        // The owner is told what was decided and this is the whole of the
        // "why". Required for the same reason it is required when refusing an
        // owner's application: a decision with no reason is one the owner can
        // only respond to by opening a support ticket to ask.
        reason: { label: "Rejection reason", placeholder: "Why is this shop being rejected?" },
    },
    deactivate: {
        status: "inactive",
        title: "Deactivate shop",
        question: "take offline",
        confirm: "Confirm deactivation",
        past: "deactivated",
        destructive: true,
        reason: { label: "Reason", placeholder: "Why is this shop being taken offline?" },
    },
    activate: {
        status: "active",
        title: "Put this shop back online",
        question: "reactivate",
        confirm: "Confirm reactivation",
        past: "reactivated",
        destructive: false,
    },
    /**
     * Not a status change at all — the row stops existing. It goes through the
     * same dialog because that is where the reason is collected and the reason
     * is the only thing the owner will be told.
     */
    delete: {
        // Labelled "Approve" on the row — it approves the owner's request —
        // but the dialog says the word the row cannot afford to: an admin
        // pressing Approve must not discover afterwards that it meant delete.
        title: "Approve the deletion — this removes the shop",
        question: "permanently delete",
        confirm: "Delete permanently",
        past: "deleted",
        destructive: true,
        deletes: true,
        reason: {
            label: "Reason",
            placeholder: "Why is this shop being deleted?",
        },
    },
    declineDeletion: {
        title: "Reject the deletion request",
        question: "reject the deletion request for",
        confirm: "Reject request",
        past: "kept — the request was rejected",
        destructive: false,
        declines: true,
        reason: {
            label: "Reason",
            placeholder: "Why is the request being declined?",
        },
    },
};

export default function AdminShopsPage() {
    const router = useRouter();
    const { shops, fetchAllShops, updateShopStatus, deleteShop, declineShopDeletion, isLoading } = useAdminShopStore();
    const [searchTerm, setSearchTerm] = useState("");
    // ?status=… — what the dashboard's "Shops awaiting approval" card links
    // to. It used to be plain state initialised to "all", so that link landed
    // an admin on an unfiltered list: they clicked a count of shops waiting
    // for them and got every shop on the platform, with nothing to say the
    // filter had been ignored.
    //
    // Read from the URL, like the shop-owners list, so the two approval cards
    // on the dashboard behave the same way and Back undoes either one.
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const statusFilter = searchParams.get("status") ?? "all";
    // ?owner= — what "View their shops" on the shop-owners list links to.
    // Kept in the URL like the status filter, so Back leaves it and a pasted
    // link opens the same list.
    const ownerFilter = searchParams.get("owner") ?? "";
    // ?deletion=requested — where the dashboard's deletion card lands. In the
    // URL like the others, so Back leaves the queue and a pasted link opens it.
    const deletionOnly = searchParams.get("deletion") === "requested";

    const clearDeletionFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("deletion");
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
    };

    const setStatusFilter = (next) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next && next !== "all") params.set("status", next);
        else params.delete("status");
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
    };

    
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

    // Whose shops these are, for the notice below. `owner_id` on this list is a
    // plain id, and the owner's name is not on the row — so the count is what
    // can honestly be said without a second request.
    const ownedByFilter = ownerFilter
        ? shops.filter((s) => String(s.owner_id) === ownerFilter)
        : [];

    const filteredShops = shops.filter(shop => {
        if (deletionOnly && !shop.metadata?.deletion_request) return false;
        if (ownerFilter && String(shop.owner_id) !== ownerFilter) return false;
        const ownerName = `${shop.owner_id?.user_id?.first_name || ""} ${shop.owner_id?.user_id?.last_name || ""}`.trim();
        const matchesSearch = shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              shop.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              ownerName.toLowerCase().includes(searchTerm.toLowerCase());
                              
        // A shop with a deletion request open is answering that question and
        // not its application, so it is out of the status QUEUES —
        // the same rule the server applies to the pending-approval count. It
        // was in both, and after the row stopped offering Approve/Reject for
        // the application it sat under "Shops awaiting approval" with no way
        // to approve it. `?deletion=requested` is where it lives until the
        // request is settled. Still listed under "All shops", though: hiding
        // it from the unfiltered list would be an admin looking at every shop
        // and not being shown one.
        if (!deletionOnly && statusFilter !== "all" && shop.metadata?.deletion_request) {
            return false;
        }

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

    const action = actionType ? SHOP_ACTIONS[actionType] : null;

    const confirmAction = async () => {
        if (!selectedActionShop || !action) return;
        // A required reason is required. The button is disabled without one,
        // so this only catches a submit that got past it.
        if (action.reason && !rejectionReason.trim()) return;

        // `const success = await …` — the store returns an OBJECT, so this was
        // truthy either way and every failed update reported success. A 409
        // refusing to activate a shop under an unapproved owner toasted
        // "approved successfully" and left the row unchanged.
        // Three different endpoints behind one dialog, because to an admin
        // these are three answers to the same question about one shop.
        const result = action.deletes
            ? await deleteShop(selectedActionShop.id, rejectionReason)
            : action.declines
              ? await declineShopDeletion(selectedActionShop.id, rejectionReason)
              : await updateShopStatus(
                    selectedActionShop.id,
                    action.status,
                    rejectionReason,
                );

        if (result?.success) {
            // "Shop kept — the request was declined successfully" reads badly,
            // so the decline carries its own whole sentence.
            toast.success(
                action.declines
                    ? "Request rejected — the shop is untouched"
                    : `Shop ${action.past} successfully`
            );
            setActionDialogOpen(false);
        } else {
            // The server's own words. It is the only thing that knows why.
            toast.error(result?.message || "Failed to update shop status");
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

            {/* What the filter is hiding, and one click to see it — the same
                notice the shop-owners list carries, because the dashboard's
                two approval cards land in these two places and should behave
                alike. Without it an admin clicks a count and watches every
                other shop vanish from a page titled "Shops". */}
            {/* The deletion queue, arrived at from the dashboard card. Same
                shape as the other filters: the page says it is filtered and
                offers the way out, because a page titled "Shops" showing two
                of forty with nothing to explain it is the complaint every one
                of these notices exists to answer. */}
            {deletionOnly && (
                <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-5 py-3"
                >
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                            {filteredShops.length} {filteredShops.length === 1 ? "shop" : "shops"} whose owner asked for deletion.
                        </span>{" "}
                        Delete it, or keep it and tell them why.
                    </p>
                    {/* "Show all shops", not "Show all N" — the status notice
                        below already uses that exact label, and with both
                        filters on the URL at once the page rendered two
                        identical buttons that did different things. */}
                    <Button onClick={clearDeletionFilter} variant="outline" size="sm">
                        Show all shops
                    </Button>
                </motion.div>
            )}

            {/* Filtered to one owner: say so, and offer the way out. Landing on
                a page titled "Shops" that silently shows three of forty is the
                same complaint the approval cards answered. */}
            {ownerFilter && (
                <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-5 py-3"
                >
                    <p className="text-sm text-muted-foreground">
                        Showing the{" "}
                        <span className="font-medium text-foreground">{ownedByFilter.length}</span>{" "}
                        {ownedByFilter.length === 1 ? "shop" : "shops"} of one owner.
                    </p>
                    <Button
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete("owner");
                            const qs = params.toString();
                            router.push(qs ? `${pathname}?${qs}` : pathname);
                        }}
                        variant="outline"
                        size="sm"
                    >
                        Show all {shops.length}
                    </Button>
                </motion.div>
            )}

            {!ownerFilter && statusFilter !== "all" && shops.length > filteredShops.length && (
                <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-5 py-3"
                >
                    <p className="text-sm text-muted-foreground">
                        Showing{" "}
                        <span className="font-medium text-foreground">{filteredShops.length}</span>{" "}
                        {statusFilter} {filteredShops.length === 1 ? "shop" : "shops"}.{" "}
                        <span className="font-medium text-foreground">
                            {shops.length - filteredShops.length}
                        </span>{" "}
                        hidden.
                    </p>
                    <Button
                        onClick={() => setStatusFilter("all")}
                        variant="outline"
                        size="sm"
                    >
                        Show all {shops.length}
                    </Button>
                </motion.div>
            )}

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
                                                    {/* The owner's own words for why this shop
                                                        should go. It was stored, returned in
                                                        the payload and never once shown — an
                                                        admin was being asked to destroy a
                                                        business and given a badge to decide on.
                                                        Quoted rather than paraphrased. */}
                                                    {shop.metadata?.deletion_request?.reason && (
                                                        <p className="mt-1.5 max-w-xs border-l-2 border-destructive/40 pl-2 text-xs text-foreground whitespace-pre-line">
                                                            {shop.metadata.deletion_request.reason}
                                                        </p>
                                                    )}
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
                                            {/* On the row as well as in the queue: an admin
                                                scrolling the unfiltered list should be able to
                                                see which shops are waiting on them. */}
                                            {shop.metadata?.deletion_request && (
                                                <Badge className="mr-2 border bg-destructive/10 text-destructive border-destructive/20 font-medium shadow-sm">
                                                    Deletion requested
                                                </Badge>
                                            )}
                                            <Badge className={`
                                                capitalize font-medium shadow-sm border
                                                ${shop.shop_status === 'active' ? 'bg-success/10 text-success border-success/20' : ''}
                                                ${shop.shop_status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' : ''}
                                                ${(shop.shop_status === 'inactive' || shop.shop_status === 'suspended') ? ' text-destructive border-destructive/30/20' : ''}
                                            `}>
                                                {shop.shop_status === 'active' ? 'Approved' : shop.shop_status}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* A shop whose owner has asked for it to be
                                                    deleted is answering ONE question, so the
                                                    row asks only that one. Approve deletes it;
                                                    Reject turns the request down and leaves the
                                                    shop untouched.

                                                    Everything else is hidden while a request is
                                                    open — not for tidiness, but because the row
                                                    used to show "Reject" (refuse the shop's
                                                    application) beside "Keep it" (refuse the
                                                    deletion): two buttons that read as the same
                                                    refusal and did entirely different things.
                                                    Decline the deletion and the usual actions
                                                    come back. */}
                                                {shop.metadata?.deletion_request ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleActionClick(shop, 'delete')}
                                                            className="h-8 rounded-lg bg-destructive text-white hover:bg-destructive/90"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleActionClick(shop, 'declineDeletion')}
                                                            className="h-8 rounded-lg"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                    {/* Approve and Reject, out of the menu.
                                                        They were two clicks behind an
                                                        unlabelled ⋯ on the one screen whose
                                                        whole purpose is making that decision
                                                        — and on a filtered "pending" list,
                                                        the decision is the only thing an
                                                        admin is here to do. Everything else
                                                        the row offers is navigation and
                                                        stays in the menu.

                                                        Only for `pending`: a shop already
                                                        decided has no approval to give, and
                                                        changing a live shop's status is what
                                                        the details dialog is for. */}
                                                    {shop.shop_status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleActionClick(shop, 'approve')}
                                                                className="h-8 rounded-lg bg-success text-success-foreground hover:bg-success/90"
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleActionClick(shop, 'reject')}
                                                                className="h-8 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* A live shop can be taken down. The endpoint
                                                        always allowed it — deactivating is not gated
                                                        on the owner's state, precisely so an admin
                                                        can act on a shop whose owner they have just
                                                        revoked — but nothing on this screen asked
                                                        for it. */}
                                                    {shop.shop_status === 'active' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleActionClick(shop, 'deactivate')}
                                                            className="h-8 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5 mr-1" />
                                                            Deactivate
                                                        </Button>
                                                    )}

                                                    {/* And back. Activating IS gated on the owner
                                                        being approved, so this can be refused — the
                                                        409 explains why and now reaches the admin
                                                        instead of a generic failure toast. */}
                                                    {(shop.shop_status === 'inactive' || shop.shop_status === 'suspended') && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleActionClick(shop, 'activate')}
                                                            className="h-8 rounded-lg bg-success text-success-foreground hover:bg-success/90"
                                                        >
                                                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                            Activate
                                                        </Button>
                                                    )}

                                                    </>
                                                )}

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            // An icon with no text is nothing at all to a screen reader,
                                                            // and this menu now holds the permanent delete.
                                                            aria-label={`More actions for ${shop.name || shop.shop_name || "this shop"}`}
                                                            className="h-8 w-8 rounded-lg hover:bg-muted transition-colors"
                                                        >
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
                                                            onClick={() => router.push(`/admin/shops/${shop.id}/edit`)}
                                                        >
                                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                                            Edit shop
                                                        </DropdownMenuItem>

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

                                                    
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
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
                            {action?.destructive ? (
                                <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                            ) : (
                                <div className="p-2 rounded-full dark:bg-success/20 text-success">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                            )}
                            {action?.title}
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to {action?.question} <span className="font-semibold text-foreground">{selectedActionShop?.name || selectedActionShop?.shop_name}</span>?
                            {/* Said before the decision, not discovered after
                                it: this is the difference between deactivating
                                and every other row action. */}
                            {action?.status === 'inactive' && " Customers will no longer see it or be able to order from it."}
                            {action?.deletes && " Its products and order history go with it, and this cannot be undone."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* What the owner asked for, in front of the admin at the
                        moment they answer it — not only back on the row they
                        clicked from. */}
                    {selectedActionShop?.metadata?.deletion_request && (action?.deletes || action?.declines) && (
                        <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3">
                            <p className="text-xs font-medium text-foreground">The owner asked for this, saying:</p>
                            <p className="mt-1.5 whitespace-pre-line border-l-2 border-destructive/40 pl-2 text-sm text-foreground">
                                {selectedActionShop.metadata.deletion_request.reason}
                            </p>
                        </div>
                    )}

                    {action?.reason && (
                        <div className="py-2">
                            <label htmlFor="shop-action-reason" className="text-sm font-medium mb-1.5 block text-foreground">
                                {action.reason.label}
                            </label>
                            <Textarea 
                                id="shop-action-reason"
                                placeholder={action.reason.placeholder}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="resize-none bg-muted border-border focus:ring-destructive"
                            />
                            {/* The owner is sent this text and nothing else
                                explains the decision to them. */}
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                The shop owner is told this.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="ghost" onClick={() => setActionDialogOpen(false)} className="rounded-xl hover:bg-muted">
                            Cancel
                        </Button>
                        <Button 
                            className={`rounded-xl shadow-lg ${
                                action?.destructive
                                    ? 'bg-destructive hover:bg-destructive/90 text-white shadow-destructive/20'
                                    : 'bg-success hover:bg-success/90 text-white'
                            }`}
                            disabled={Boolean(action?.reason) && !rejectionReason.trim()}
                            onClick={confirmAction}
                        >
                            {action?.confirm}
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

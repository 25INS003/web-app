"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useShopStore } from "@/store/shopStore";
import { toast } from "sonner";
import {
    Store,
    Plus,
    Trash2,
    Loader2,
    MapPin,
    Phone,
    CheckCircle,
    XCircle,
    Search,
    Edit,
    ShoppingBag,
    Package,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.03, delayChildren: 0 }
    }
};

const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 }
    }
};

// ==========================================
// Main My Shops Page Component
// ==========================================
const MyShopsPage = () => {
    const router = useRouter();
    const { 
        myShops, 
        fetchMyShops, 
        isLoading, 
        deactivateExistingShop,
        activateExistingShop,
        requestShopDeletion,
        withdrawShopDeletionRequest,
        error: storeError 
    } = useShopStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => {
        fetchMyShops();
    }, [fetchMyShops]);

    const handleEditShop = (shopId) => {
        router.push(`/myshop/edit/${shopId}`);
    };

    const handleDeactivate = async (shopId) => {
        if (!window.confirm("Are you sure you want to deactivate this shop? It will be marked as inactive.")) return;
        
        const result = await deactivateExistingShop(shopId);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const handleActivate = async (shopId) => {
        if (!window.confirm("Are you sure you want to activate this shop?")) return;
        
        const result = await activateExistingShop(shopId);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    /**
     * Ask an admin to delete a shop.
     *
     * This used to delete it outright, from here, including the order history
     * — the single most destructive action in the app, on the dashboard of the
     * person with the least reason to weigh it. The decision is an admin's; a
     * reason is required because that is all they will have to go on.
     *
     * A dialog, not `window.prompt`. The prompt was a single-line native box
     * with no room to explain and no styling, browsers suppress it after
     * repeated dialogs — so the button could silently do nothing — and it is
     * the only one left in the app; the admin's side of this same decision has
     * always been a proper dialog.
     */
    const [deletionTarget, setDeletionTarget] = useState(null);
    const [deletionReason, setDeletionReason] = useState("");
    const [isRequesting, setIsRequesting] = useState(false);

    const openDeletionDialog = (shopId) => {
        setDeletionTarget(myShops?.find((s) => s.id === shopId) ?? null);
        setDeletionReason("");
    };

    const submitDeletionRequest = async () => {
        const reason = deletionReason.trim();
        // The confirm button is disabled without one; this catches a submit
        // that got past it.
        if (!deletionTarget || !reason) return;

        setIsRequesting(true);
        const result = await requestShopDeletion(deletionTarget.id, reason);
        setIsRequesting(false);

        if (result.success) {
            toast.success(result.message);
            setDeletionTarget(null);
        } else {
            toast.error(result.message);
        }
    };

    const handleWithdrawDeletion = async (shopId) => {
        const result = await withdrawShopDeletionRequest(shopId);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const filteredShops = myShops?.filter(shop => {
        if (!searchTerm) return true; // Show all if no search term
        const term = searchTerm.toLowerCase();
        return (
            (shop.name && shop.name.toLowerCase().includes(term)) ||
            (shop.category && shop.category.toLowerCase().includes(term)) ||
            (shop.city && shop.city.toLowerCase().includes(term))
        );
    }) || [];

    // `shop_status` defaults to 'pending', so a missing value means not-yet-
    // approved. The old `|| !s.shop_status` counted exactly that case as
    // active — backwards, and it would have shown a pending shop as live.
    const activeShops = myShops?.filter(s => s.shop_status === 'active').length || 0;
    // Counted so the page can account for the gap between "Total Shops" and
    // "Active Shops". Without it a first-time owner sees 1 and 0 and no reason
    // for the difference.
    const pendingShops = myShops?.filter(s => s.shop_status === 'pending').length || 0;
    const totalProducts = myShops?.reduce((sum, s) => sum + (s.total_products || 0), 0) || 0;
    const totalOrders = myShops?.reduce((sum, s) => sum + (s.total_orders || 0), 0) || 0;

    const stats = [
        { title: "Total Shops", value: myShops?.length || 0, icon: Store, tone: "bg-primary text-primary-foreground" },
        { title: "Active Shops", value: activeShops, icon: CheckCircle, tone: "bg-success text-success-foreground" },
        { title: "Total Products", value: totalProducts, icon: Package, tone: "bg-accent text-accent-foreground" },
        { title: "Total Orders", value: totalOrders, icon: ShoppingBag, tone: "bg-warning text-warning-foreground" }
    ];

    return (
        <motion.div 
            className="container mx-auto p-6 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-foreground">
                        <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/25">
                            <Store className="h-6 w-6 text-primary-foreground" />
                        </div>
                        My Shops
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage all your shops in one place
                    </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                        onClick={() => router.push("/myshop/add")}
                        className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 px-5 py-2.5"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Shop
                    </Button>
                </motion.div>
            </motion.div>

            {storeError && (
                <motion.div 
                    variants={itemVariants}
                    className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl"
                >
                    {storeError}
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        variants={itemVariants}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {stat.title}
                                </p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.tone} shadow-lg`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Why "Active Shops" is lower than "Total Shops". Sitting under
                the stats rather than at the top of the page, because it is
                the explanation for a number the owner has just read. */}
            {pendingShops > 0 && (
                <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/25 bg-warning/5 px-5 py-4"
                >
                    <Clock className="h-5 w-5 shrink-0 text-warning" />
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                            {pendingShops} {pendingShops === 1 ? "shop is" : "shops are"} waiting for admin approval.
                        </span>{" "}
                        {pendingShops === 1 ? "It will not" : "They will not"} appear to
                        customers or take orders until approved. You can add products to{" "}
                        {pendingShops === 1 ? "it" : "them"} while you wait.
                    </p>
                </motion.div>
            )}

            {/* Search Bar */}
            <motion.div 
                variants={itemVariants}
                className={`flex items-center rounded-2xl px-5 py-4 transition-all duration-300 border-2 bg-white dark:bg-muted/60 ${
                    searchFocused 
                        ? 'border-primary shadow-lg shadow-primary/10' 
                        : 'border-border'
                }`}
            >
                <Search className={`transition-colors ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} size={20} />
                <input
                    type="text"
                    placeholder="Search shops by name, category, or city..."
                    className="ml-3 w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                />
            </motion.div>

            {/* Content */}
            {isLoading ? (
                <motion.div 
                    variants={itemVariants}
                    className="flex justify-center items-center h-64"
                >
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </motion.div>
            ) : filteredShops.length === 0 ? (
                <EmptyState onAdd={() => router.push("/myshop/add")} isSearch={!!searchTerm} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredShops.map((shop, index) => (
                        <ShopCard
                            key={shop.id}
                            shop={shop}
                            index={index}
                            onEdit={handleEditShop}
                            onDeactivate={handleDeactivate}
                            onActivate={handleActivate}
                            onRequestDeletion={openDeletionDialog}
                            onWithdrawDeletion={handleWithdrawDeletion}
                        />
                    ))}
                </div>
            )}

            {/* Asking an admin to delete a shop.
            
                The reason is the whole request: an admin is being asked to
                destroy a shop's products and its order history, and this text
                is the only thing they will have to decide on. So it is
                required, it has room to be written in, and the dialog says
                plainly what is being asked for and what happens next. */}
            <Dialog
                open={Boolean(deletionTarget)}
                onOpenChange={(open) => !open && setDeletionTarget(null)}
            >
                <DialogContent className="rounded-2xl sm:max-w-md bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="grid size-9 place-items-center rounded-full bg-destructive/10 text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </span>
                            Ask an admin to delete this shop
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            <span className="font-semibold text-foreground">
                                {deletionTarget?.name}
                            </span>{" "}
                            will keep trading until an admin decides. If they agree, its
                            products and order history are removed for good.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <label
                            htmlFor="deletion-reason"
                            className="mb-1.5 block text-sm font-medium text-foreground"
                        >
                            Why should it be deleted?
                        </label>
                        <Textarea
                            id="deletion-reason"
                            value={deletionReason}
                            onChange={(e) => setDeletionReason(e.target.value)}
                            placeholder="e.g. We have closed this branch and moved to the new address."
                            className="resize-none bg-muted border-border"
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            The admin reviewing this sees exactly what you write here.
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setDeletionTarget(null)}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitDeletionRequest}
                            disabled={!deletionReason.trim() || isRequesting}
                            className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                        >
                            {isRequesting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Send request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

// --- Shop Card Component ---
/**
 * Whether this shop is offline because an ADMIN said so, rather than because
 * its owner closed it. Both are `inactive`; only the mark tells them apart,
 * and the server refuses the owner's Activate for the first — so offering the
 * button would be a control that can only ever produce an error toast.
 */
/** Whether the owner has asked an admin to delete this shop. */
const deletionRequested = (shop) => Boolean(shop.metadata?.deletion_request);

const takenDownByAdmin = (shop) =>
    shop.shop_status === 'inactive' && Boolean(shop.metadata?.deactivated_by_admin);

const ShopCard = ({ shop, index, onEdit, onDeactivate, onActivate, onRequestDeletion, onWithdrawDeletion }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm group"
    >
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                        <Store className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-foreground">
                            {shop.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            {shop.category || 'General'}
                        </span>
                    </div>
                </div>

                <Button
                    size="sm"
                    onClick={() => onEdit(shop.id)}
                    className="rounded-lg bg-muted text-muted-foreground hover:bg-accent"
                >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{shop.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{shop.city || 'No location'}</span>
                </div>
            </div>

            {/* What "awaiting approval" means for them, on the card rather
                than only as a chip: an owner whose shop is invisible to
                customers should not have to work that out from one word. */}
            {shop.shop_status === 'pending' && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/5 p-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Waiting for an admin to review this shop.</span>{" "}
                        Customers cannot see it or order from it yet. You can keep
                        adding products in the meantime.
                    </p>
                </div>
            )}

            {/* Why the shop is dark, when it was not the owner's doing. The
                admin's own words, because the alternative is an owner watching
                orders stop with no idea why — and support is the only way to
                answer back. */}
            {takenDownByAdmin(shop) && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="min-w-0 text-xs text-muted-foreground">
                        <p>
                            <span className="font-medium text-foreground">An admin took this shop offline.</span>{" "}
                            Customers cannot see it or order from it, and you cannot put it back yourself.
                        </p>
                        {shop.metadata?.status_note && (
                            <p className="mt-1.5 border-l-2 border-destructive/40 pl-2 text-foreground">
                                {shop.metadata.status_note}
                            </p>
                        )}
                        <Link
                            href="/dashboard/support"
                            className="mt-2 inline-block font-medium text-primary hover:underline"
                        >
                            Ask support to review it
                        </Link>
                    </div>
                </div>
            )}

            {/* A request an admin has not answered yet. Shown as its own panel
                rather than a chip: it is a thing the owner started and is
                waiting on, and the only way to stop it is here. */}
            {deletionRequested(shop) && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
                    <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="min-w-0 text-xs text-muted-foreground">
                        <p>
                            <span className="font-medium text-foreground">Deletion requested.</span>{" "}
                            An admin will decide. The shop keeps trading until they do.
                        </p>
                        {shop.metadata?.deletion_request?.reason && (
                            <p className="mt-1.5 border-l-2 border-destructive/40 pl-2 text-foreground">
                                {shop.metadata.deletion_request.reason}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={() => onWithdrawDeletion(shop.id)}
                            className="mt-2 font-medium text-primary hover:underline"
                        >
                            Withdraw the request
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-border">
                {/* `pending` used to render as the bare word in grey, which
                    says nothing about why the shop is not selling. It is the
                    state every new shop starts in now, so it has to explain
                    itself.

                    No `|| 'active'` fallback on any of these: `shop_status` is
                    NOT NULL, so a missing value means the shop did not load,
                    and calling that "active" is how a pending shop came to
                    tell its owner it was live. */}
                <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        shop.shop_status === 'pending'
                            ? 'bg-warning/15 text-warning'
                            : shop.shop_status === 'active'
                            ? 'bg-success/15 text-success'
                            : shop.shop_status === 'inactive' ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                        shop.shop_status === 'pending' ? 'bg-warning animate-pulse'
                        : shop.shop_status === 'active' ? 'bg-success'
                        : shop.shop_status === 'inactive' ? 'bg-destructive' : 'bg-muted-foreground'}`} />
                    {shop.shop_status === 'pending'
                        ? 'Awaiting approval'
                        : takenDownByAdmin(shop)
                        ? 'Taken offline by admin'
                        : (shop.shop_status ?? 'unknown')}
                </span>

                {/* The actions that used to be behind the three-dot menu in
                    the card header, so the one thing an owner comes to this
                    page to do — take a shop off the storefront — was two
                    clicks behind an icon that names nothing. They sit beside
                    the status chip they act on. Which button appears is the
                    shop's state, and the states do not share one:
                      active   → Deactivate
                      inactive → Activate
                      pending  → neither. It is not live to be taken down, and
                                 only an admin can put it live.
                    Asking for deletion is offered whatever the state, because
                    it is a request rather than an act. */}
                <div className="flex items-center gap-2">
                    {/* Was a permanent delete, here, on this card. It removed
                        the shop's products AND its order history — the most
                        destructive thing in the app, on the dashboard of the
                        person least likely to be weighing that. It asks an
                        admin now. */}
                    {!deletionRequested(shop) && (
                        <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Ask an admin to delete this shop"
                            title="Ask an admin to delete this shop"
                            onClick={() => onRequestDeletion(shop.id)}
                            className="rounded-lg px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}

                    {shop.shop_status === 'active' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDeactivate(shop.id)}
                            className="rounded-lg border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                        >
                            <XCircle className="h-3 w-3 mr-1" /> Deactivate
                        </Button>
                    )}

                    {shop.shop_status === 'inactive' && !takenDownByAdmin(shop) && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onActivate(shop.id)}
                            className="rounded-lg border-success/40 text-success hover:bg-success/10 hover:text-success"
                        >
                            <CheckCircle className="h-3 w-3 mr-1" /> Activate
                        </Button>
                    )}
                </div>
            </div>
        </div>
    </motion.div>
);

// --- Empty State Component ---
const EmptyState = ({ onAdd, isSearch }) => (
    <motion.div 
        variants={itemVariants}
        className="rounded-2xl border border-border bg-card"
    >
        <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-muted mb-4">
                <Store className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">
                {isSearch ? "No shops found" : "No shops yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
                {isSearch ? "Try a different search term" : "Create your first shop to get started"}
            </p>
            {!isSearch && (
                <Button onClick={onAdd} className="rounded-xl bg-primary">
                    <Plus className="mr-2 h-4 w-4" /> Add Your First Shop
                </Button>
            )}
        </div>
    </motion.div>
);

export default MyShopsPage;
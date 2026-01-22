"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    RefreshCw,
    CheckCircle,
    ShoppingBag,
    BarChart3,
    Users,
    ChevronDown,
} from 'lucide-react';

import { useShopStore } from '@/store/shopStore';
import GlobalSelectShop from '@/components/Dropdowns/selectShop0';
import OrderFilter from '@/components/order/OrderFilter';
import OrderTable from '@/components/order/OrderTable';
import { useShopOrderStore } from '@/store/shopOrderStore';
import { cn } from '@/lib/utils'; // Assuming you have a utility function for class names

const OrdersDashboard = () => {
    // --- GLOBAL SHOP ---
    const { currentShop } = useShopStore();
    const shopId = currentShop?._id ?? null;

    // --- ORDER STORE ---
    const {
        orders = [],
        total = 0,
        page,
        limit,
        isLoading,
        fetchOrders,
        setPage,
        acceptOrders,
    } = useShopOrderStore();

    // --- LOCAL STATE ---
    const [filters, setFilters] = useState({});
    const [activeTab, setActiveTab] = useState("all");

    // --- FETCH ORDERS ---
    useEffect(() => {
        if (!shopId) return;

        const queryParams = {
            page,
            limit,
            ...filters,
        };

        if (activeTab !== "all") {
            queryParams.order_status = activeTab;
        }

        fetchOrders(shopId, queryParams);
    }, [shopId, page, limit, filters, activeTab, fetchOrders]);

    // --- HANDLERS ---
    const handleRefresh = () => {
        if (!shopId) return;
        fetchOrders(shopId, { page: 1, limit, ...filters, order_status: activeTab === "all" ? undefined : activeTab });
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1); 
    };

    const handleTabChange = (val) => {
        setActiveTab(val);
        setPage(1); 
    };

    const handleProcessPending = async () => {
        if (!shopId) return;

        const pendingIds = orders
            .filter((o) => o.order_status === "pending")
            .map((o) => o._id);

        if (pendingIds.length > 0) {
            await acceptOrders(shopId, pendingIds);
            fetchOrders(shopId, { page, limit, ...filters, order_status: activeTab === "all" ? undefined : activeTab });
        }
    };

    // --- CLIENT-SIDE STATS ---
    const stats = useMemo(() => {
        const allOrders = orders || [];
        const delivered = allOrders.filter((o) => o.order_status === "delivered");

        return {
            pageRevenue: delivered
                .reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
                .toFixed(2),
            activeCustomers: new Set(allOrders.map((o) => o.customer_id)).size,
            pendingCount: allOrders.filter((o) => o.order_status === "pending").length,
        };
    }, [orders]);

    // --- NO SHOP SELECTED ---
    if (!shopId) {
        return (
            <div className="flex-1 w-full flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-6 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
                            <ShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                            Select a Shop
                        </h2>
                        <p className="text-muted-foreground mt-2">
                            Please choose a shop to manage orders.
                        </p>
                    </div>
                    <GlobalSelectShop ShowLabel={false} /> 
                </Card>
            </div>
        );
    }

    // --- MAIN RENDER ---
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-4 md:p-6 lg:p-8 space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                        Orders
                    </h1>
                    <p className="flex items-center gap-2 text-muted-foreground text-base">
                        Managing:
                        <Badge variant="outline" className="px-3 py-1 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-500/10 backdrop-blur-sm">
                            {currentShop?.name || "Selected Shop"}
                        </Badge>
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <div className="w-[240px]">
                        <GlobalSelectShop />
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 backdrop-blur-sm"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>

                    <Button
                        onClick={handleProcessPending}
                        disabled={stats.pendingCount === 0 || isLoading}
                        className="h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-500/20"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept All Pending ({stats.pendingCount})
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Revenue"
                    subLabel="Current Page"
                    value={`₹${stats.pageRevenue}`}
                    icon={<ShoppingBag className="w-6 h-6 text-white" />}
                    color="bg-indigo-500"
                    gradient="from-indigo-500 via-purple-500 to-violet-500"
                    delay={0.1}
                />
                <StatCard
                    label="Active Customers"
                    subLabel="On Page"
                    value={stats.activeCustomers}
                    icon={<Users className="w-6 h-6 text-white" />}
                    color="bg-pink-500"
                    gradient="from-pink-500 via-rose-500 to-red-500"
                    delay={0.2}
                />
                <StatCard
                    label="Total Orders"
                    subLabel="Lifetime"
                    value={total}
                    icon={<BarChart3 className="w-6 h-6 text-white" />}
                    color="bg-emerald-500"
                    gradient="from-emerald-500 via-teal-500 to-cyan-500"
                    delay={0.3}
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
                {/* Floating Segmented Control */}
                <div className="flex justify-center">
                    <TabsList className="h-auto p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full border border-white/20 dark:border-slate-700/50 shadow-sm">
                        {["all", "pending", "preparing", "ready", "delivered"].map((tab) => (
                            <TabsTrigger 
                                key={tab}
                                value={tab}
                                className="relative rounded-full px-6 py-2.5 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-none font-medium z-10"
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTabBackground"
                                        className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-md -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className={cn(
                                    "capitalize transition-colors duration-200",
                                    activeTab === tab ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                )}>
                                    {tab === "all" ? "All Orders" : tab}
                                </span>
                                {tab === "pending" && stats.pendingCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-in fade-in zoom-in duration-300 z-20">
                                        {stats.pendingCount}
                                    </span>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="space-y-6">
                    {/* Glassmorphic Filter Bar Container */}
                    <div className="p-1 rounded-2xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="rounded-xl px-4 py-3">
                            <OrderFilter
                                filters={filters}
                                onFilterChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-black/20"
                    >
                        <OrderTable
                            shopId={shopId}
                            orders={orders}
                            total={total}
                            pagination={{ page, limit }}
                            onPageChange={setPage}
                            isLoading={isLoading}
                        />
                         
                         {/* Enhanced Empty State - only visible when not loading and no orders */}
                         {!isLoading && orders.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-24 h-24 mb-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800 rotate-3">
                                    <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">No orders found</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                                    There are no orders in this category yet. New orders will appear here automatically.
                                </p>
                            </div>
                         )}
                    </motion.div>
                </div>
            </Tabs>
        </motion.div>
    );
};

const StatCard = ({ label, subLabel, value, icon, color, gradient, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
    >
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden relative group hover:shadow-md transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-annotated blur-2xl transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700`} />
            <CardContent className="p-6 flex items-center justify-between relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                         <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                         {subLabel && <span className="text-xs text-slate-400 dark:text-slate-500">{subLabel}</span>}
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-${color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

export default OrdersDashboard;
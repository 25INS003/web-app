"use client";

import { useEffect, useState, useMemo } from 'react';
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
        // Reset page to 1 on explicit refresh, retaining filters/tab
        fetchOrders(shopId, { page: 1, limit, ...filters, order_status: activeTab === "all" ? undefined : activeTab });
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1); // Reset to page 1 on filter change
    };

    const handleTabChange = (val) => {
        setActiveTab(val);
        setPage(1); // Reset to page 1 on tab change
    };

    const handleProcessPending = async () => {
        if (!shopId) return;

        // Only process pending orders currently visible on the table/page
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
        // Calculate stats based on ALL orders if they were fetched, 
        // but since we only have the current page, we rely on `total` and `orders` for client-side stats.
        // NOTE: The `totalRevenue` calculated here is only for the DELIVERED orders on the current page.
        // It should ideally be calculated server-side for the shop's total revenue.

        const allOrders = orders || [];
        
        const delivered = allOrders.filter(
            (o) => o.order_status === "delivered"
        );

        return {
            // Revenue for delivered orders on the current page
            pageRevenue: delivered
                .reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
                .toFixed(2),
            // Unique customers on the current page
            activeCustomers: new Set(allOrders.map((o) => o.customer_id)).size,
            // Pending count on the current page
            pendingCount: allOrders.filter(
                (o) => o.order_status === "pending"
            ).length,
        };
    }, [orders]);

    // --- NO SHOP SELECTED ---
    if (!shopId) {
        return (
            <div className="flex-1 w-full flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-6 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold dark:text-slate-100">Select a Shop</h2>
                        <p className="text-muted-foreground dark:text-slate-400">
                            Please choose a shop to manage orders.
                        </p>
                    </div>
                    {/* Assuming GlobalSelectShop handles dark theme internally */}
                    <GlobalSelectShop ShowLabel={false} /> 
                </Card>
            </div>
        );
    }

    // --- MAIN RENDER ---
    return (
        // DARK THEME FIX for main content background
        <div className="p-4 md:p-6 lg:p-8 space-y-6 dark:text-slate-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-slate-100">
                        Order Management
                    </h1>
                    <p className="text-muted-foreground dark:text-slate-400">
                        Managing:&nbsp;
                        <span className="font-semibold text-foreground dark:text-slate-200">
                            {currentShop?.name || "Selected Shop"}
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <div className="w-[220px]">
                        <GlobalSelectShop />
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-100"
                    >
                        <RefreshCw
                            className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
                        />
                        Refresh
                    </Button>

                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                        onClick={handleProcessPending}
                        disabled={stats.pendingCount === 0 || isLoading}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Pending ({stats.pendingCount})
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    label="Page Revenue (Delivered)"
                    value={`₹${stats.pageRevenue}`}
                    icon={<ShoppingBag className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />}
                />
                <StatCard
                    label="Active Customers (Page)"
                    value={stats.activeCustomers}
                    icon={<Users className="w-6 h-6 text-pink-500 dark:text-pink-400" />}
                />
                <StatCard
                    label="Total Orders (All Time)"
                    value={total}
                    icon={<BarChart3 className="w-6 h-6 text-teal-500 dark:text-teal-400" />}
                />
            </div>

            {/* Tabs */}
            {/* TabsList and TabsTrigger need dark theme styling */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-4 dark:bg-slate-800 dark:border dark:border-slate-700">
                    <TabsTrigger value="all" className="dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100">All Orders</TabsTrigger>
                    <TabsTrigger value="pending" className="dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100">
                        Pending
                        {stats.pendingCount > 0 && (
                            <Badge variant="destructive" className="ml-2 dark:bg-red-600 dark:text-white">
                                {stats.pendingCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="preparing" className="dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100">Preparing</TabsTrigger>
                    <TabsTrigger value="ready" className="dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100">Ready</TabsTrigger>
                    <TabsTrigger value="delivered" className="dark:text-slate-300 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100">History</TabsTrigger>
                </TabsList>

                {/* OrderFilter and OrderTable components need to handle dark theme internally */}
                <OrderFilter
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                <OrderTable
                    shopId={shopId}
                    orders={orders}
                    total={total}
                    pagination={{ page, limit }}
                    onPageChange={setPage}
                    isLoading={isLoading}
                />
            </Tabs>
        </div>
    );
};

const StatCard = ({ label, value, icon }) => (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-4 flex items-center justify-between">
            <div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{label}</p>
                <p className="text-2xl font-bold dark:text-slate-100">{value}</p>
            </div>
            <div className="p-2 bg-muted rounded-full dark:bg-slate-700">
                {icon}
            </div>
        </CardContent>
    </Card>
);

export default OrdersDashboard;
"use client";
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, CheckCircle, ShoppingBag, BarChart3, Users } from 'lucide-react';

// Ensure these paths match your project structure
import SelectShop from '@/components/Dropdowns/selectShop'; 
import OrderFilter from '@/components/order/OrderFilter';
import OrderTable from '@/components/order/OrderTable';
import { useShopOrderStore } from '@/store/shopOrderStore'; // Adjusted to your path

const OrdersDashboard = () => {
    const [shopSelected, setShopSelected] = useState(null);
    const shopId = shopSelected?._id;

    // --- Store Access ---
    const {
        orders,
        total,
        page,
        limit,
        isLoading,
        fetchOrders,
        setPage,
        acceptOrders
    } = useShopOrderStore();

    // --- Local State for Filters ---
    const [filters, setFilters] = useState({});
    const [activeTab, setActiveTab] = useState("all");

    // --- Data Fetching ---
    useEffect(() => {
        if (!shopId) return;

        const queryParams = {
            page,
            limit,
            ...filters, 
        };

        // Handle Tab specific override
        if (activeTab !== 'all') {
            queryParams.order_status = activeTab;
        }

        fetchOrders(shopId, queryParams);
    }, [shopId, page, limit, filters, activeTab, fetchOrders]);

    // --- Handlers ---
    const handleRefresh = () => {
        if (shopId) fetchOrders(shopId, { page, limit, ...filters });
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
            .filter(o => o.order_status === 'pending')
            .map(o => o._id);

        if (pendingIds.length > 0) {
            await acceptOrders(shopId, pendingIds);
        }
    };

    // --- Client-Side Stats ---
    const stats = useMemo(() => {
        if (!orders.length) return { totalRevenue: "0.00", activeCustomers: 0, pendingCount: 0 };
        
        // Note: This only calculates based on current page data. 
        // For accurate totals, you should fetch from a /stats endpoint.
        const delivered = orders.filter(o => o.order_status === 'delivered');
        return {
            totalRevenue: delivered.reduce((acc, curr) => acc + curr.total_amount, 0).toFixed(2),
            activeCustomers: new Set(orders.map(o => o.customer_id)).size,
            pendingCount: orders.filter(o => o.order_status === 'pending').length
        };
    }, [orders]);

    // --- Render ---
    if (!shopSelected) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold">Select a Shop</h2>
                        <p className="text-muted-foreground">Please choose a shop to manage orders.</p>
                    </div>
                    <SelectShop selectedShop={shopSelected} onShopSelect={setShopSelected} />
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
                    <p className="text-muted-foreground">
                        Managing: <span className="font-semibold text-foreground">{shopSelected.name || "Selected Shop"}</span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Shop Switcher in Header */}
                    <div className="w-[200px]">
                        <SelectShop 
                            selectedShop={shopSelected} 
                            onShopSelect={setShopSelected} 
                        />
                    </div>

                    <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleProcessPending}
                        disabled={stats.pendingCount === 0 || isLoading}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Pending ({stats.pendingCount})
                    </Button>
                    {/* <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button> */}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Page Revenue</p>
                            <p className="text-2xl font-bold">${stats.totalRevenue}</p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-full dark:bg-green-900">
                            <ShoppingBag className="h-5 w-5 text-green-600 dark:text-green-300" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active Customers</p>
                            <p className="text-2xl font-bold">{stats.activeCustomers}</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Orders</p>
                            <p className="text-2xl font-bold">{total}</p>
                        </div>
                        <div className="p-2 bg-orange-100 rounded-full dark:bg-orange-900">
                            <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs & Content */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="bg-white dark:bg-slate-800/60 border mb-4">
                    <TabsTrigger value="all">All Orders</TabsTrigger>
                    <TabsTrigger value="pending">
                        Pending
                        {stats.pendingCount > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1">{stats.pendingCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="preparing">Preparing</TabsTrigger>
                    <TabsTrigger value="ready">Ready</TabsTrigger>
                    <TabsTrigger value="delivered">History</TabsTrigger>
                </TabsList>

                <div className="space-y-6">
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
                </div>
            </Tabs>
        </div>
    );
};

export default OrdersDashboard;
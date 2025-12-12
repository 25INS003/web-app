"use client";
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, CheckCircle, ShoppingBag, BarChart3, Users } from 'lucide-react';
import SelectShop from '@/components/Dropdowns/selectShop';
import OrderFilter from '@/components/order/OrderFilter';
import OrderTable from '@/components/order/OrderTable';
import { useShopOrderStore } from '@/store/shopOrderStore';


const OrdersDashboard = () => {
    const [shopSelected, setShopSelected] = useState(null);
    useEffect(()=>{
        const shopId = shopSelected?._id || null;
        console.log("Selected Shop ID:", shopId);
    },[shopSelected])

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
    // We manage filters locally in the page to compose the API query
    const [filters, setFilters] = useState({});
    const [activeTab, setActiveTab] = useState("all");

    // --- Data Fetching ---

    // Fetch orders whenever dependencies change (Server-Side Pagination/Filtering)
    useEffect(() => {
        const queryParams = {
            page,
            limit,
            ...filters, // Spread search, minAmount, startDate, etc.
        };

        // Handle Tab specific override
        if (activeTab !== 'all') {
            queryParams.order_status = activeTab;
        }

        fetchOrders(shopSelected, queryParams);
    }, [shopSelected, page, limit, filters, activeTab, fetchOrders]);


    // --- Handlers ---

    const handleRefresh = () => {
        fetchOrders(shopSelected, { page, limit, ...filters });
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1); // Reset to page 1 on filter change
    };

    const handleTabChange = (val) => {
        setActiveTab(val);
        setPage(1); // Reset to page 1
    };

    const handleProcessPending = async () => {
        // Find all pending IDs currently visible
        const pendingIds = orders
            .filter(o => o.order_status === 'pending')
            .map(o => o._id);

        if (pendingIds.length > 0) {
            await acceptOrders(shopId, pendingIds);
        }
    };

    // --- Simple Client-Side Stats (Note: For accurate totals, use a dedicated /stats endpoint) ---
    // Using current view's data for immediate feedback, but ideally this comes from API
    const stats = useMemo(() => {
        const delivered = orders.filter(o => o.order_status === 'delivered');
        return {
            totalRevenue: delivered.reduce((acc, curr) => acc + curr.total_amount, 0).toFixed(2),
            activeCustomers: new Set(orders.map(o => o.customer_id)).size,
            pendingCount: orders.filter(o => o.order_status === 'pending').length
        };
    }, [orders]);

    return (shopSelected ?
        (
            <div className="p-4 md:p-6 lg:p-8 space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
                        <p className="text-muted-foreground">Manage incoming orders and track delivery status.</p>
                    </div>
                    <SelectShop
                        selectedShop={shopSelected}
                        onShopChange={setShopSelected}
                    />


                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleProcessPending}
                            disabled={stats.pendingCount === 0}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept All Pending ({stats.pendingCount})
                        </Button>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                    </div>
                </div>

                {/* Stats Cards (Simplified) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Visible Revenue</p>
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
                                <p className="text-sm text-muted-foreground">Customers (Page)</p>
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

                {/* Tabs & Filters */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="bg-white dark:bg-slate-800/60 border mb-4">
                        <TabsTrigger value="all">All Orders</TabsTrigger>
                        <TabsTrigger value="pending">
                            Pending
                            {stats.pendingCount > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1">{stats.pendingCount}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="preparing">Preparing</TabsTrigger>
                        <TabsTrigger value="ready">Ready for Pickup</TabsTrigger>
                        <TabsTrigger value="delivered">History</TabsTrigger>
                    </TabsList>

                    <div className="space-y-6">
                        <OrderFilter
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            totalResults={total}
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
        )
        :
        (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <SelectShop
                    selectedShop={shopSelected}
                    onShopChange={setShopSelected}
                />
            </div>
        )
    );
};

export default OrdersDashboard;
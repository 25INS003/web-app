"use client";
import { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    Package,
    DollarSign,
    ListOrdered,
    CheckCircle,
    Users,
    ShoppingBag,
    BarChart3,
    RefreshCw,
    Download,
    Filter,
    AlertCircle
} from 'lucide-react';
// Import the components being used
import OrderFilter from '@/components/order/OrderFilter';
import OrderTable from '@/components/order/OrderTable';
// Import the Zustand Store
import { useOrdersStore } from '@/store/ordersStore';
/**
 * Reusable Stat Card component (Unchanged)
 */
const StatCard = ({ title, value, icon: Icon, description, iconBgColor, trend, change, loading = false }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-slate-800/60 border-border dark:border-border relative overflow-hidden">
        {/* Cleaned up gradient and used Tailwind/shadcn tokens */}
        <div className={`absolute top-0 left-0 w-1 h-full ${iconBgColor.replace('bg-', 'bg-gradient-to-b from-')}`} />

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={`p-2 rounded-lg ${iconBgColor} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-4 w-4 text-white" />
            </div>
        </CardHeader>

        <CardContent className="pl-4">
            {loading ? (
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
                </div>
            ) : (
                <>
                    {/* Using text-foreground for primary values */}
                    <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                        {value}
                        {trend && (
                            <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="h-5 text-xs">
                                {trend === 'up' ? '↗' : '↘'} {change}
                            </Badge>
                        )}
                    </div>
                    {/* Using text-muted-foreground for descriptions */}
                    <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                        {description}
                    </p>
                </>
            )}
        </CardContent>
    </Card>
);



// Main Component
const OrdersDashboard = () => {
    // 1. Hook into the Zustand store
    const orders = useOrdersStore((state) => state.orders);
    const filters = useOrdersStore((state) => state.filters);
    const sortConfig = useOrdersStore((state) => state.sortConfig);
    const currentPage = useOrdersStore((state) => state.currentPage);
    const isRefreshing = useOrdersStore((state) => state.isRefreshing);
    const updateOrderStatus = useOrdersStore((state) => state.updateOrderStatus);
    const processPendingOrders = useOrdersStore((state) => state.processPendingOrders);
    const fetchOrders = useOrdersStore((state) => state.fetchOrders);
    const setFilters = useOrdersStore((state) => state.setFilters);
    const setSortConfig = useOrdersStore((state) => state.setSortConfig);
    const setCurrentPage = useOrdersStore((state) => state.setCurrentPage);
    const clearAllState = useOrdersStore((state) => state.clearAllState);



    // Derive activeTab from filters state for the Tabs component
    const activeTab = useMemo(() => {
        return filters.status || 'all';
    }, [filters.status]);


    // 2. Statistics Calculation (uses useMemo on store data)
    const stats = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        const todayOrders = orders.filter(order =>
            new Date(order.order_time) >= todayStart
        );

        const yesterdayOrders = orders.filter(order =>
            new Date(order.order_time) >= yesterdayStart && new Date(order.order_time) < todayStart
        );

        const totalOrders = orders.length;
        const pendingCount = orders.filter(o => o.order_status === 'pending').length;
        const preparingCount = orders.filter(o => o.order_status === 'preparing').length;
        const readyCount = orders.filter(o => o.order_status === 'ready').length;
        const inTransitCount = orders.filter(o => o.order_status === 'in_transit').length;
        const deliveredCount = orders.filter(o => o.order_status === 'delivered').length;
        const cancelledCount = orders.filter(o => o.order_status === 'cancelled').length;

        const totalRevenue = orders
            .filter(o => o.order_status === 'delivered')
            .reduce((sum, order) => sum + (order.total_amount || 0), 0);

        const todayRevenue = todayOrders
            .filter(o => o.order_status === 'delivered')
            .reduce((sum, order) => sum + (order.total_amount || 0), 0);

        const averageOrderValue = deliveredCount > 0
            ? totalRevenue / deliveredCount
            : 0;

        const todayOrderCount = todayOrders.length;
        const yesterdayOrderCount = yesterdayOrders.length;
        const orderGrowth = yesterdayOrderCount > 0
            ? ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount * 100).toFixed(1)
            : todayOrderCount > 0 ? '100' : '0';

        // Get unique customers
        const uniqueCustomers = [...new Set(orders.map(order => order.customer_id))].length;

        // Get total items sold
        const totalItemsSold = orders.reduce((sum, order) =>
            sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0), 0
        );

        return {
            totalOrders,
            pendingCount,
            preparingCount,
            readyCount,
            inTransitCount,
            deliveredCount,
            cancelledCount,
            totalRevenue: totalRevenue.toFixed(2),
            todayRevenue: todayRevenue.toFixed(2),
            averageOrderValue: averageOrderValue.toFixed(2),
            todayOrderCount,
            orderGrowth,
            uniqueCustomers,
            totalItemsSold,
            completionRate: totalOrders > 0
                ? ((deliveredCount / totalOrders) * 100).toFixed(1)
                : '0'
        };
    }, [orders]);


    // 3. Filtering and Sorting Logic (Completed Logic)
    const processedOrders = useMemo(() => {
        let result = orders;

        // 1. Apply Status/Tab Filter
        if (filters.status && filters.status !== 'all') {
            if (filters.status === 'active') {
                result = result.filter(o =>
                    ['preparing', 'ready', 'in_transit'].includes(o.order_status)
                );
            } else {
                result = result.filter(o => o.order_status === filters.status);
            }
        }

        // 2. Apply Search Filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            result = result.filter(order =>
                order.order_id.toLowerCase().includes(searchTerm) ||
                order.customer?.name.toLowerCase().includes(searchTerm) ||
                order.customer_id.toLowerCase().includes(searchTerm)
            );
        }

        // 3. Apply Price Filters (Completed)
        if (filters.minAmount) { // Corrected key from minPrice to minAmount
            const min = parseFloat(filters.minAmount);
            result = result.filter(order => (order.total_amount || 0) >= min);
        }
        if (filters.maxAmount) { // Corrected key from maxPrice to maxAmount
            const max = parseFloat(filters.maxAmount);
            result = result.filter(order => (order.total_amount || 0) <= max);
        }

        // 4. Apply Date Range Filters (Completed)
        if (filters.startDate) {
            const startDate = new Date(filters.startDate).getTime();
            result = result.filter(order => new Date(order.order_time).getTime() >= startDate);
        }
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            // Ensure the comparison is inclusive up to the end of the day specified by endDate
            endDate.setHours(23, 59, 59, 999);
            const endDateTime = endDate.getTime();
            result = result.filter(order => new Date(order.order_time).getTime() <= endDateTime);
        }

        // 5. Apply Sorting (Completed with logic from other snippet)
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Special handling for nested properties (e.g., 'customer.name')
                if (sortConfig.key.includes('.')) {
                    const [parentKey, childKey] = sortConfig.key.split('.');
                    aVal = a[parentKey]?.[childKey];
                    bVal = b[parentKey]?.[childKey];
                }

                // Type coercion for numeric and date sorting
                if (['total_amount', 'order_amount'].includes(sortConfig.key)) {
                    aVal = parseFloat(aVal || 0);
                    bVal = parseFloat(bVal || 0);
                }
                if (sortConfig.key === 'order_time') {
                    // Convert to milliseconds for comparison
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                }

                if (aVal < bVal) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [orders, filters, sortConfig]); // Depend on all relevant store states


    // 4. Action Handlers (Simplified to call store actions)
    const handleRefresh = fetchOrders;
    const handleProcessNewOrders = processPendingOrders;
    const handleExportData = () => {
        console.log('Exporting data...');
        // In a real app, you would use processedOrders here
    };



    const handleTabChange = (status) => {
        // Clear all filters if switching back to 'all' or apply the status filter
        if (status === 'all') {
            setFilters({});
        } else {
            setFilters({ status });
        }
    };


    return (
        <div className="p-4 md:p-6 lg:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Order Dashboard</h1>

            {/* Header with Actions */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleProcessNewOrders}
                        disabled={stats.pendingCount === 0}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Process Pending ({stats.pendingCount})
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2" onClick={handleExportData} >
                        <Download className="w-4 h-4" /> Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics Section */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={ListOrdered}
                    description={`${stats.todayOrderCount} today • ${stats.orderGrowth}% growth`}
                    iconBgColor="bg-gradient-to-br from-primary to-primary/80"
                    trend={parseFloat(stats.orderGrowth) > 0 ? 'up' : 'down'}
                    change={`${stats.orderGrowth}%`}
                />
                <StatCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue}`}
                    icon={DollarSign}
                    description={`$${stats.todayRevenue} today • $${stats.averageOrderValue} avg order`}
                    iconBgColor="bg-gradient-to-br from-green-500 to-emerald-600"
                    trend="up"
                    change="12.5%"
                />
                <StatCard
                    title="Active Orders"
                    value={stats.preparingCount + stats.readyCount + stats.inTransitCount}
                    icon={Package}
                    description={`${stats.readyCount} ready for pickup`}
                    iconBgColor="bg-gradient-to-br from-blue-500 to-cyan-600"
                    trend="up"
                    change="5.2%"
                />
                <StatCard
                    title="Delivery Rate"
                    value={`${stats.completionRate}%`}
                    icon={CheckCircle}
                    description={`${stats.deliveredCount} delivered • ${stats.cancelledCount} cancelled`}
                    iconBgColor="bg-gradient-to-br from-purple-500 to-indigo-600"
                    trend="up"
                    change="1.1%"
                />
            </div>
            <Tabs className="my-5 " value={activeTab} onValueChange={(value) => setFilters({ status: value })}>
                <TabsList className="bg-white dark:bg-slate-800/60">
                    <TabsTrigger value={undefined}>All Orders</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="confirm">Active</TabsTrigger>
                    <TabsTrigger value="delivered">Delivered</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Filter and Table Section */}
            <div className="space-y-6">
                <OrderFilter
                    filters={filters}
                    onFilterChange={setFilters}
                    pagination={{ currentPage }}
                    processedOrdersCount={processedOrders.length}
                />
                <OrderTable
                    orders={processedOrders}
                    onStatusUpdate={updateOrderStatus}
                    pagination={{ currentPage }}
                    onPageChange={setCurrentPage}
                    sortConfig={sortConfig}
                    onSort={setSortConfig}
                    filters={filters}
                    handleClearFilters={clearAllState} // Pass the clear action
                />
            </div>

            {/* Summary Footer */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white dark:bg-slate-800/60 border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Items Sold</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats.totalItemsSold}
                                </p>
                            </div>
                            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-800/60 border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                                <p className="text-2xl font-bold text-foreground">
                                    ${stats.averageOrderValue}
                                </p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800/60 border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Customers</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats.uniqueCustomers}
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OrdersDashboard;
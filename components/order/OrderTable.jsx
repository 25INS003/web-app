"use client";

import { useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle, Eye } from 'lucide-react';
import { useShopOrderStore } from '@/store/shopOrderStore';

// Status Badge Helper
const getStatusBadge = (status) => {
    const styles = {
        pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
        confirmed: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
        preparing: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200",
        ready: "bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200",
        picked_up: "bg-violet-100 text-violet-800 hover:bg-violet-200 border-violet-200",
        in_transit: "bg-violet-100 text-violet-800 hover:bg-violet-200 border-violet-200",
        delivered: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
        cancelled: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
        refunded: "bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200",
    };
    return <Badge className={`${styles[status] || 'bg-gray-100'} border`}>{status?.replace('_', ' ').toUpperCase()}</Badge>;
};

const OrderTable = ({
    orders = [],
    total = 0,
    shopId, // Required for actions
    pagination = {}, // { page, limit }
    onPageChange, // store.setPage -> triggers fetch in parent
    isLoading = false
}) => {
    const { acceptOrders, markOrdersReady, updateOrderStatus } = useShopOrderStore();

    const { page, limit } = pagination;
    const totalPages = Math.ceil(total / limit) || 1;

    // --- Handlers ---

    const handleStatusChange = async (orderId, newStatus) => {
        // Map UI actions to specific Store functions for better semantic handling
        if (newStatus === 'confirmed') {
            await acceptOrders(shopId, orderId);
        } else if (newStatus === 'ready') {
            await markOrdersReady(shopId, orderId);
        } else {
            await updateOrderStatus(shopId, orderId, newStatus);
        }
    };

    // --- Renderers ---

    const renderPaginationButtons = useCallback(() => {
        const buttons = [];
        const maxVisible = 5;
        
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, page + 2);

        if (endPage - startPage < maxVisible - 1) {
            if (startPage === 1) endPage = Math.min(totalPages, maxVisible);
            else if (endPage === totalPages) startPage = Math.max(1, totalPages - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <Button
                    key={i}
                    variant={i === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(i)}
                    className="w-8 h-8 p-0"
                >
                    {i}
                </Button>
            );
        }
        return buttons;
    }, [page, totalPages, onPageChange]);

    // --- Empty State ---
    if (!isLoading && orders.length === 0) {
        return (
            <Card className="border bg-white dark:bg-slate-800/60 shadow-sm bg-card">
                <CardContent className="p-12 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No orders found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your filters or date range.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="border bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                                <TableHead className="w-[140px]">Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead className="text-center">Items</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center w-[200px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order._id} className="hover:bg-muted/30">
                                    <TableCell className="font-mono font-medium text-xs">
                                        {order.order_id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">
                                                {typeof order.customer_id === 'object' ? order.customer_id.name : 'Guest'}
                                            </span>
                                            {order.delivery_address?.phone_number && (
                                                <span className="text-xs text-muted-foreground">{order.delivery_address.phone_number}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {new Date(order.order_time).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="font-normal">
                                            {order.items?.length || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        ${order.total_amount?.toFixed(2)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Smart Action Button Logic */}
                                            {order.order_status === 'pending' ? (
                                                <Button 
                                                    size="sm" 
                                                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleStatusChange(order._id, 'confirmed')}
                                                >
                                                    Accept
                                                </Button>
                                            ) : order.order_status === 'preparing' ? (
                                                <Button 
                                                    size="sm" 
                                                    className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                                                    onClick={() => handleStatusChange(order._id, 'ready')}
                                                >
                                                    Mark Ready
                                                </Button>
                                            ) : (
                                                <Select
                                                    value={order.order_status}
                                                    onValueChange={(val) => handleStatusChange(order._id, val)}
                                                    disabled={['delivered', 'cancelled', 'refunded'].includes(order.order_status)}
                                                >
                                                    <SelectTrigger className="h-8 w-[110px] text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="in_transit">In Transit</SelectItem>
                                                        <SelectItem value="delivered">Delivered</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Server-Side Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex gap-1">{renderPaginationButtons()}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTable;
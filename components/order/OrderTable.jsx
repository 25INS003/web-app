"use client";

import { useCallback, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, AlertCircle, Eye } from 'lucide-react';
import { useShopOrderStore } from '@/store/shopOrderStore';
import OrderDetailsModal from './OrderDetailsModal';

const getStatusBadge = (status) => {
    const styles = {
        pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
        confirmed: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
        preparing: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200",
        ready: "bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200",
        picked_up: "bg-violet-100 text-violet-800 hover:bg-violet-200 border-violet-200",
        delivered: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
        cancelled: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
    };
    return <Badge className={`${styles[status] || 'bg-gray-100'} border`}>{status?.replace('_', ' ').toUpperCase()}</Badge>;
};

const OrderTable = ({
    orders = [],
    total = 0,
    shopId,
    pagination = { page: 1, limit: 25 },
    onPageChange,
    isLoading = false
}) => {
    // Get Actions from Store
    const { acceptOrders, markOrdersReady, updateOrderStatus } = useShopOrderStore();
    const { page, limit } = pagination;
    const totalPages = Math.ceil(total / limit) || 1;

    // Modal State
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (orderId) => {
        setSelectedOrderId(orderId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrderId(null);
    };

    const handleStatusChange = async (orderId, newStatus) => {
        if (!shopId) return;
        if (newStatus === 'confirmed') {
            await acceptOrders(shopId, orderId);
        } else if (newStatus === 'ready') {
            await markOrdersReady(shopId, orderId);
        } else {
            await updateOrderStatus(shopId, orderId, newStatus);
        }
    };

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

    if (!isLoading && orders.length === 0) {
        return (
            <Card className="border bg-white dark:bg-slate-800/60 shadow-sm">
                <CardContent className="p-12 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No orders found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your filters.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
        <div className="space-y-4">
            <Card className="border bg-white dark:bg-slate-800/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Items</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order._id} className="hover:bg-muted/30">
                                    <TableCell className="font-mono font-medium text-xs">{order.order_id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">
                                                {order.delivery_address?.full_name || 'Guest'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {order.delivery_address?.phone_number}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {new Date(order.order_time).toLocaleDateString()}
                                        <br />
                                        <span className="text-muted-foreground">
                                            {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">{order.items?.length || 0}</TableCell>
                                    <TableCell className="text-right font-semibold">${order.total_amount?.toFixed(2)}</TableCell>
                                    <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            {/* View Details Button */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                                onClick={() => handleViewDetails(order.order_id)}
                                                title="View Order Details"
                                            >
                                                <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                            </Button>
                                            
                                            {order.order_status === 'pending' ? (
                                                <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange(order.order_id, 'confirmed')}>Accept</Button>
                                            ) : order.order_status === 'confirmed' ? (
                                                <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleStatusChange(order.order_id, 'preparing')}>Start Preparing</Button>
                                            ) : order.order_status === 'preparing' ? (
                                                <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleStatusChange(order.order_id, 'ready')}>Ready</Button>
                                            ) : order.order_status === 'ready' ? (
                                                <Button size="sm" className="h-8 bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleStatusChange(order.order_id, 'picked_up')}>Picked Up</Button>
                                            ) : (
                                                <Select value={order.order_status} onValueChange={(val) => handleStatusChange(order.order_id, val)} disabled={['delivered', 'cancelled', 'refunded'].includes(order.order_status)}>
                                                    <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="picked_up">Picked Up</SelectItem>
                                                        <SelectItem value="in_transit">In Transit</SelectItem>
                                                        <SelectItem value="delivered">Delivered</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                        <SelectItem value="refunded">Refunded</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <div className="flex gap-1">{renderPaginationButtons()}</div>
                        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            )}
        </div>

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                orderId={selectedOrderId}
                shopId={shopId}
            />
        </>
    );
};

export default OrderTable;
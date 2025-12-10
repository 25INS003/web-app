// OrderTable.jsx
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { ORDER_STATUS } from '@/store/ordersStore';
import { AlertCircle } from 'lucide-react';

/**
 * =================================================================
 * Utility Components & Functions (Unchanged)
 * =================================================================
 */
const getStatusBadge = (status) => {
    switch (status) {
        case 'pending':
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900">Pending</Badge>;
        case 'confirmed':
            return <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900">Confirmed</Badge>;
        case 'preparing':
            return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900">Preparing</Badge>;
        case 'ready':
            return <Badge className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900">Ready</Badge>;
        case 'picked_up':
        case 'in_transit':
            return <Badge className="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900">In Transit</Badge>;
        case 'delivered':
            return <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900">Delivered</Badge>;
        case 'cancelled':
            return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900">Cancelled</Badge>;
        case 'refunded':
            return <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900">Refunded</Badge>;
        default:
            return <Badge variant="outline">Unknown</Badge>;
    }
};


/**
 * =================================================================
 * Main Component: OrderTable
 * =================================================================
 */

const OrderTable = ({
    orders = [], // Already filtered/sorted
    onStatusUpdate = () => { }, // Store updateOrderStatus
    pagination = {},
    onPageChange = () => { }, // Store setCurrentPage
    sortConfig = {},
    onSort = () => { }, // Store setSortConfig
    itemsPerPage = 8,
    showPagination = true,
    filters = {},
    handleClearFilters = () => { }, // Store clearAllState
}) => {
    // The table is a controlled component, reading state from props
    const currentPage = pagination.currentPage || 1;
    const sortedOrders = orders; // Use the received array as it's already processed

    // --- Pagination Calculations ---
    const totalOrders = sortedOrders.length;
    const totalPages = Math.ceil(totalOrders / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage);
    // --- End Pagination Calculations ---

    /**
     * Handles page change, calling the store action provided by onPageChange prop.
     */
    const handlePageChange = useCallback((page) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        onPageChange(page); // Call the store action
    }, [currentPage, totalPages, onPageChange]);

    /**
     * Handles column header click to toggle sorting. Calls the store action.
     */
    const handleSort = useCallback((key) => {
        const newSortConfig = { ...sortConfig };

        if (newSortConfig.key === key) {
            newSortConfig.direction = newSortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            newSortConfig.key = key;
            newSortConfig.direction = 'asc';
        }
        onSort(newSortConfig); // Call the store action
    }, [sortConfig, onSort]);


    // Define table columns with their respective sort keys for cleaner JSX
    const tableColumns = [
        { name: 'Order ID', key: 'order_id', align: 'left', className: 'w-[160px]', isSortable: true },
        { name: 'Customer', key: 'customer.name', align: 'left', isSortable: true },
        { name: 'Date & Time', key: 'order_time', align: 'left', isSortable: true },
        { name: 'Items', key: null, align: 'center', isSortable: false },
        { name: 'Total Amount', key: 'total_amount', align: 'right', isSortable: true },
        { name: 'Status', key: 'order_status', align: 'left', isSortable: false },
        { name: 'Actions', key: null, align: 'center', className: 'w-[220px]', isSortable: false },
    ];

    /**
     * Renders a sortable table header cell.
     */
    const renderSortableHeader = (column, index) => {
        if (!column.isSortable) {
            return <TableHead key={index} className={column.className}>{column.name}</TableHead>;
        }
        const isActive = sortConfig.key === column.key;
        const direction = sortConfig.direction;

        return (
            <TableHead 
                key={index} 
                className={`${column.className || ''} cursor-pointer hover:bg-muted text-${column.align}`} 
                onClick={() => handleSort(column.key)}
            >
                <div className={`flex items-center group ${column.align === 'right' ? 'justify-end' : ''}`}>
                    {column.name}
                    <ArrowUpDown 
                        className={`ml-2 h-3 w-3 transition-opacity duration-200 ${
                            isActive 
                                ? 'opacity-100 text-primary' 
                                : 'opacity-50 group-hover:opacity-100 text-muted-foreground'
                        }`}
                        // Add a visual cue for the active sort direction
                        style={{ transform: isActive && direction === 'desc' ? 'rotate(180deg)' : 'none' }}
                    />
                </div>
            </TableHead>
        );
    };

    /**
     * Renders dynamic page number buttons for pagination control. (MISSING LOGIC ADDED)
     */
    const renderPaginationButtons = useCallback(() => {
        const maxVisiblePages = 5;
        const buttons = [];

        if (totalPages <= 1) return null;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                buttons.push(i);
            }
        } else {
            // Logic for ellipsis pagination (e.g., 1 ... 5 6 7 ... 10)
            const surroundingPages = 1;
            const startRange = Math.max(2, currentPage - surroundingPages);
            const endRange = Math.min(totalPages - 1, currentPage + surroundingPages);

            // Add page 1
            buttons.push(1);

            // Add starting ellipsis
            if (startRange > 2) {
                buttons.push('...');
            }

            // Add pages around current page
            for (let i = startRange; i <= endRange; i++) {
                if (i > 1 && i < totalPages) {
                    buttons.push(i);
                }
            }
            
            // Add ending ellipsis
            if (endRange < totalPages - 1) {
                buttons.push('...');
            }

            // Add last page (if not already included)
            if (!buttons.includes(totalPages)) {
                buttons.push(totalPages);
            }
            
            // Final cleanup pass to remove adjacent duplicates (e.g., [1, '...', '...'])
            const finalButtons = buttons.filter((item, index) => item !== '...' || buttons[index - 1] !== '...');
            
            // Final cleanup to remove ellipsis if it's next to a sequential number (e.g., [1, '...', 2])
            return finalButtons.filter((item, index) => {
                 if (item === '...' && typeof finalButtons[index - 1] === 'number' && typeof finalButtons[index + 1] === 'number') {
                     // If previous page + 1 equals next page, skip the ellipsis
                     if (finalButtons[index - 1] + 1 === finalButtons[index + 1]) {
                         return false;
                     }
                 }
                 return true;
             });
        }


        return buttons.map((page, index) => {
            if (page === '...') {
                return (
                    <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-muted-foreground">...</span>
                );
            }

            return (
                <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                >
                    {page}
                </Button>
            );
        });

    }, [currentPage, totalPages, handlePageChange]);


    if (totalOrders === 0 && (filters.search || filters.minAmount || filters.maxAmount || filters.dateRange)) {
         return (
             <Card className="border shadow-sm bg-card">
                 <CardContent className="p-6 text-center">
                     <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                     <p className="text-lg font-semibold">No orders found</p>
                     <p className="text-sm text-muted-foreground">
                         Your current filters returned no results.
                     </p>
                     <Button 
                         variant="link" 
                         onClick={handleClearFilters} 
                         className="mt-2 text-primary dark:text-primary-foreground/80"
                     >
                         Clear all filters
                     </Button>
                 </CardContent>
             </Card>
         );
     }
     
    return (
        <div>
            {/* --- Order Data Table Card --- */}
            <Card className="border shadow-sm bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                {tableColumns.map((column, index) => renderSortableHeader(column, index))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedOrders.length > 0 ? (
                                paginatedOrders.map((order) => (
                                    <TableRow key={order.order_id} className="hover:bg-muted/30 transition-colors" >
                                        {/* Order ID */}
                                        <TableCell className="font-medium font-mono">
                                            <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted/50 text-sm">
                                                {order.order_id}
                                            </div>
                                        </TableCell>

                                        {/* Customer Info */}
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-foreground">{order.customer?.name || order.customer_id}</div>
                                                {order.customer?.email && (
                                                    <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Date & Time */}
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="text-sm text-foreground">
                                                    {new Date(order.order_time).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Items */}
                                        <TableCell className="text-center">
                                            {order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                        </TableCell>

                                        {/* Total Amount */}
                                        <TableCell className="text-right font-semibold">
                                            ${(order.total_amount || 0).toFixed(2)}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            {getStatusBadge(order.order_status)}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-center w-[220px]">
                                            <div className="flex justify-center items-center gap-2">
                                                {/* Status Update Dropdown */}
                                                <Select
                                                    onValueChange={(newStatus) => onStatusUpdate(order.order_id, newStatus)}
                                                    value={order.order_status}
                                                >
                                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                                        <SelectValue placeholder="Update Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.values(ORDER_STATUS).map(status => (
                                                            <SelectItem key={status} value={status}>
                                                                {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {/* View Details Button */}
                                                <Button variant="outline" size="sm" className="h-8 text-xs">
                                                    View
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No orders match your current filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* --- Pagination Controls --- */}
            {showPagination && totalPages > 1 && (
                <Card className="mt-4 border shadow-sm bg-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalOrders)} of {totalOrders} orders
                            </div>
                            <div className="flex items-center space-x-2">
                                {/* Previous Button */}
                                <Button
                                    key="prev"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>

                                {/* Dynamic Page Number Buttons */}
                                <div className="flex items-center gap-1">
                                    {renderPaginationButtons()}
                                </div>

                                {/* Next Button */}
                                <Button
                                    key="next"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="gap-1"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default OrderTable;
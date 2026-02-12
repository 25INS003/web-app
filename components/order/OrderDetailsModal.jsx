"use client";

import { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Package,
    MapPin,
    User,
    Phone,
    Calendar,
    CreditCard,
    Truck,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
} from 'lucide-react';
import { useShopOrderStore } from '@/store/shopOrderStore';

const getStatusBadge = (status) => {
    const styles = {
        pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        confirmed: "bg-blue-100 text-blue-800 border-blue-200",
        preparing: "bg-indigo-100 text-indigo-800 border-indigo-200",
        ready: "bg-sky-100 text-sky-800 border-sky-200",
        picked_up: "bg-violet-100 text-violet-800 border-violet-200",
        in_transit: "bg-purple-100 text-purple-800 border-purple-200",
        delivered: "bg-green-100 text-green-800 border-green-200",
        cancelled: "bg-red-100 text-red-800 border-red-200",
        refunded: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return <Badge className={`${styles[status] || 'bg-gray-100'} border font-medium`}>{status?.replace('_', ' ').toUpperCase()}</Badge>;
};

const InfoRow = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-start gap-3 ${className}`}>
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">{value || 'N/A'}</p>
        </div>
    </div>
);

const OrderDetailsModal = ({ isOpen, onClose, orderId, shopId }) => {
    const { currentOrder, isOrderLoading, fetchOrderDetails, error } = useShopOrderStore();

    useEffect(() => {
        if (isOpen && orderId && shopId) {
            fetchOrderDetails(shopId, orderId);
        }
    }, [isOpen, orderId, shopId, fetchOrderDetails]);

    const order = currentOrder;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b">
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
                                <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Order Details</h2>
                                <p className="text-sm font-mono text-muted-foreground">{order?.order_id || 'Loading...'}</p>
                            </div>
                        </div>
                        {order && getStatusBadge(order.order_status)}
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
                    {isOrderLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <span className="ml-3 text-muted-foreground">Loading order details...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <XCircle className="h-12 w-12 text-red-500 mb-3" />
                            <p className="text-red-600 font-medium">Error loading order</p>
                            <p className="text-muted-foreground text-sm mt-1">{error}</p>
                        </div>
                    ) : order ? (
                        <div className="p-6 space-y-6">
                            {/* Customer & Delivery Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <Card className="border-slate-200 dark:border-slate-700">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-indigo-600" />
                                            Customer Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <InfoRow
                                            icon={User}
                                            label="Name"
                                            value={order.delivery_address?.full_name || order.customer_id?.name || 'Guest'}
                                        />
                                        <InfoRow
                                            icon={Phone}
                                            label="Phone"
                                            value={order.delivery_address?.phone_number || order.customer_id?.phone}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Delivery Address */}
                                <Card className="border-slate-200 dark:border-slate-700">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-emerald-600" />
                                            Delivery Address
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <InfoRow
                                            icon={MapPin}
                                            label="Address"
                                            value={order.delivery_address ? 
                                                `${order.delivery_address.address_line || ''}, ${order.delivery_address.city || ''}, ${order.delivery_address.state || ''} ${order.delivery_address.zip_code || ''}`.trim() 
                                                : 'N/A'}
                                        />
                                        {order.delivery_address?.landmark && (
                                            <InfoRow
                                                icon={MapPin}
                                                label="Landmark"
                                                value={order.delivery_address.landmark}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Order Timeline */}
                            <Card className="border-slate-200 dark:border-slate-700">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-violet-600" />
                                        Order Timeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <InfoRow
                                            icon={Calendar}
                                            label="Order Placed"
                                            value={order.order_time ? new Date(order.order_time).toLocaleString() : 'N/A'}
                                        />
                                        {order.confirmed_time && (
                                            <InfoRow
                                                icon={CheckCircle}
                                                label="Confirmed"
                                                value={new Date(order.confirmed_time).toLocaleString()}
                                            />
                                        )}
                                        {order.ready_time && (
                                            <InfoRow
                                                icon={Package}
                                                label="Ready"
                                                value={new Date(order.ready_time).toLocaleString()}
                                            />
                                        )}
                                        {order.delivered_time && (
                                            <InfoRow
                                                icon={Truck}
                                                label="Delivered"
                                                value={new Date(order.delivered_time).toLocaleString()}
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Order Items */}
                            <Card className="border-slate-200 dark:border-slate-700">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Package className="h-4 w-4 text-orange-600" />
                                        Order Items ({order.items?.length || 0})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {order.items?.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    {item.product_image ? (
                                                        <img 
                                                            src={item.product_image} 
                                                            alt={item.product_name}
                                                            className="w-12 h-12 object-cover rounded-lg border"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-lg">
                                                            <Package className="h-5 w-5 text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                                            {item.product_name || 'Product'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Qty: {item.quantity} × ₹{item.unit_price?.toFixed(2) || '0.00'}
                                                        </p>
                                                        {item.variant_name && (
                                                            <p className="text-xs text-indigo-600">{item.variant_name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                        ₹{((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Summary */}
                            <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-green-600" />
                                        Payment Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>₹{order.sub_total?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        {order.delivery_fee > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Delivery Fee</span>
                                                <span>₹{order.delivery_fee?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {order.discount_amount > 0 && (
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Discount</span>
                                                <span>-₹{order.discount_amount?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {order.tax_amount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Tax</span>
                                                <span>₹{order.tax_amount?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <Separator className="my-2" />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total</span>
                                            <span className="text-emerald-600">₹{order.total_amount?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        {order.payment_method && (
                                            <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                                                <span className="text-muted-foreground">Payment Method</span>
                                                <Badge variant="outline" className="capitalize">{order.payment_method}</Badge>
                                            </div>
                                        )}
                                        {order.payment_status && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Payment Status</span>
                                                <Badge 
                                                    variant="outline" 
                                                    className={order.payment_status === 'paid' 
                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'}
                                                >
                                                    {order.payment_status?.toUpperCase()}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Special Instructions */}
                            {order.special_instructions && (
                                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                                    <CardContent className="pt-4">
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Special Instructions</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300">{order.special_instructions}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-20">
                            <p className="text-muted-foreground">No order data available</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OrderDetailsModal;

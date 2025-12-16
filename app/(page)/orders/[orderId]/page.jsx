"use client";

import { useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useShopOrderStore } from "@/store/useShopOrderStore";
import {useShopStore} from '@/store/shopStore';


// Helper function to format date
const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString();
};

export default function OrderDetailsPage() {
    const params = useParams();
    const orderId = params.orderId;

    const { currentShopId } = useShopStore();
    const shopId = currentShopId;

    const {
        currentOrder,
        isOrderLoading,
        error,
        fetchOrderDetails,
        clearError,
    } = useShopOrderStore();

    const loadOrder = useCallback(() => {
        if (shopId && orderId) {
            clearError();
            fetchOrderDetails(shopId, orderId);
        }
    }, [shopId, orderId, fetchOrderDetails, clearError]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    if (!orderId) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Error</h1>
                <p className="text-red-500">Order ID is missing from the URL.</p>
            </div>
        );
    }

    if (isOrderLoading) {
        return <div className="p-4">Loading order details...</div>;
    }

    if (error) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Error</h1>
                <p className="text-red-500">{error}</p>
                <button
                    onClick={loadOrder}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!currentOrder) {
        return <div className="p-4">Order not found.</div>;
    }

    const {
        order_id,
        order_status,
        total_amount,
        items,
        customer_id,
        delivery_address_id,
        status_logs,
        payment_method,
        order_time,
        executive_id
    } = currentOrder;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-extrabold mb-6 text-gray-800">
                Order Details: #{order_id}
            </h1>

            {/* Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card title="Status" value={order_status.toUpperCase()} />
                <Card title="Total Amount" value={`$${total_amount.toFixed(2)}`} />
                <Card title="Order Time" value={formatDate(order_time)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Customer & Address */}
                <section className="lg:col-span-1">
                    <SectionCard title="Customer & Delivery">
                        <h3 className="font-semibold text-lg text-gray-700 mb-2">Customer Info</h3>
                        <p><strong>Name:</strong> {customer_id?.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {customer_id?.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {customer_id?.phone || 'N/A'}</p>
                        <hr className="my-4" />
                        <h3 className="font-semibold text-lg text-gray-700 mb-2">Delivery Address</h3>
                        <p>{delivery_address_id?.street_address || 'N/A'}</p>
                        <p>{delivery_address_id?.city || 'N/A'}, {delivery_address_id?.state || 'N/A'} - {delivery_address_id?.zip_code || 'N/A'}</p>
                        <hr className="my-4" />
                        <h3 className="font-semibold text-lg text-gray-700 mb-2">Other Details</h3>
                        <p><strong>Payment:</strong> {payment_method || 'N/A'}</p>
                        <p><strong>Delivery Executive:</strong> {executive_id?.name || 'Unassigned'}</p>
                    </SectionCard>
                </section>

                {/* Order Items & Status History */}
                <section className="lg:col-span-2 space-y-8">
                    <SectionCard title="Items Ordered">
                        <div className="space-y-4">
                            {items?.map((item, index) => (
                                <div key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                                    <p className="text-gray-900 font-medium">
                                        {item.product_name}
                                        {item.variant_name && <span className="text-sm text-gray-500"> ({item.variant_name})</span>}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-mono">{item.quantity}</span> x ${item.unit_price.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard title="Order Status History">
                        <ol className="relative border-s border-gray-200 ml-3">
                            {status_logs?.map((log, index) => (
                                <li key={index} className="mb-6 ms-6">
                                    <span className="absolute flex items-center justify-center w-3 h-3 bg-blue-100 rounded-full -start-1.5 ring-4 ring-white"></span>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {log.new_status.toUpperCase()}
                                        <span className="text-xs font-normal text-gray-500 ml-3">
                                            ({formatDate(log.changed_at)})
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {log.notes}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </SectionCard>
                </section>
            </div>

        </div>
    );
}

// Simple Card Component for layout
const Card = ({ title, value }) => (
    <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-blue-500">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
);

// Simple Section Card Component
const SectionCard = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-blue-700 border-b pb-3 mb-4">{title}</h2>
        {children}
    </div>
);
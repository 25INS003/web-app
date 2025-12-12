// stores/OrdersStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// --- Constants ---
export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    COD_SELECTED: 'cod_selected',
    REFUNDED: 'refunded',
    FAILED: 'failed'
};

export const PAYMENT_METHOD = {
    COD: 'cod',
    ONLINE: 'online',
    WALLET: 'wallet'
};

export const SORT_DIRECTION = {
    ASC: 'asc',
    DESC: 'desc'
};


// --- Sample Data ---
// (Initial orders array from the snippet is assumed to be here)
const initialOrders = [
    {
        order_id: 'ORD20251209001',
        customer_id: '64f1c3e9b6a1d2f1a0000001',
        customer: { name: 'Alice Johnson', email: 'alice@email.com' },
        shop_id: '64f1c3e9b6a1d2f1a0000101',
        shop: { name: 'Corner Store' },
        executive_id: null,
        order_status: 'pending',
        items: [
            { product_id: null, product_name: 'Blue T-Shirt', quantity: 1, unit_price: 29.99, total_price: 29.99 },
            { product_id: null, product_name: 'Socks', quantity: 2, unit_price: 15.00, total_price: 30.00 },
        ],
        order_amount: 59.99,
        delivery_fee: 5.00,
        tax_amount: 2.00,
        discount_amount: 0,
        total_amount: 66.99,
        payment_method: 'cod',
        payment_status: 'pending',
        delivery_address: { full_name: 'Alice Johnson', pincode: '560001', city: 'Bengaluru' },
        order_time: '2025-12-09T10:12:00Z'
    },
    {
        order_id: 'ORD20251209002',
        customer_id: '64f1c3e9b6a1d2f1a0000002',
        customer: { name: 'Bob Smith', email: 'bob@email.com' },
        shop_id: '64f1c3e9b6a1d2f1a0000102',
        shop: { name: 'Gadget Hub' },
        executive_id: null,
        order_status: 'preparing',
        items: [{ product_id: null, product_name: 'Wireless Mouse', quantity: 1, unit_price: 155.50, total_price: 155.50 }],
        order_amount: 155.50,
        delivery_fee: 0,
        tax_amount: 10.00,
        discount_amount: 0,
        total_amount: 165.50,
        payment_method: 'online',
        payment_status: 'paid',
        delivery_address: { full_name: 'Bob Smith', pincode: '560002', city: 'Bengaluru' },
        order_time: '2025-12-09T11:20:00Z'
    },
    // ... rest of initialOrders data
];

// --- Utility Functions (Used by getFilteredOrders) ---
const filterOrders = (orders, filters) => {
    // This logic is already handled in page.js for the processedOrders useMemo,
    // but the original store snippet suggests the store might use it internally.
    // I will include the full filter logic here for a robust store implementation.
    return orders.filter(order => {
        // Status Filter
        if (filters.order_status && filters.order_status !== 'all') {
            if (filters.order_status === 'active') {
                 if (!['preparing', 'ready', 'in_transit'].includes(order.order_status)) return false;
            } else if (order.order_status !== filters.order_status) {
                return false;
            }
        }

        // Payment Status Filter
        if (filters.payment_status && filters.payment_status !== 'all' && order.payment_status !== filters.payment_status) {
            return false;
        }

        // Payment Method Filter
        if (filters.payment_method && filters.payment_method !== 'all' && order.payment_method !== filters.payment_method) {
            return false;
        }

        // Date Range Filter (Using store's startDate/endDate keys)
        if (filters.startDate) {
            const orderDate = new Date(order.order_time).getTime();
            const startDate = new Date(filters.startDate).getTime();
            if (orderDate < startDate) return false;
        }
        if (filters.endDate) {
            const orderDate = new Date(order.order_time).getTime();
            // OrderFilter.jsx now sets endDate to the end of the day, so direct comparison is safe.
            const endDate = new Date(filters.endDate).getTime(); 
            if (orderDate > endDate) return false;
        }

        // Search Filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matches = order.order_id.toLowerCase().includes(searchTerm) ||
                order.customer?.name.toLowerCase().includes(searchTerm) ||
                order.customer?.email.toLowerCase().includes(searchTerm) ||
                order.shop?.name.toLowerCase().includes(searchTerm) ||
                order.delivery_address?.pincode.includes(searchTerm);
            if (!matches) return false;
        }

        // Amount Range Filter (Using minAmount/maxAmount)
        const totalAmount = order.total_amount || 0;
        if (filters.minAmount && totalAmount < parseFloat(filters.minAmount)) {
            return false;
        }
        if (filters.maxAmount && totalAmount > parseFloat(filters.maxAmount)) {
            return false;
        }

        return true;
    });
};

const sortOrders = (orders, sortConfig) => {
    if (!sortConfig.key) return orders;

    // Create a copy to avoid mutating the original state array
    return [...orders].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested properties
        if (sortConfig.key.includes('.')) {
            const keys = sortConfig.key.split('.');
            aValue = keys.reduce((obj, key) => obj?.[key], a);
            bValue = keys.reduce((obj, key) => obj?.[key], b);
        }

        // Handle date sorting
        if (sortConfig.key === 'order_time') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }

        // Handle null/undefined values
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        if (aValue < bValue) {
            return sortConfig.direction === SORT_DIRECTION.ASC ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === SORT_DIRECTION.ASC ? 1 : -1;
        }
        return 0;
    });
};

// --- Zustand Store Definition ---
export const useOrdersStore = create(
    persist(
        (set, get) => ({
            // --- State ---
            orders: initialOrders,
            filters: {
                order_status: 'all',
                payment_status: 'all',
                payment_method: 'all',
                search: '',
                startDate: null,
                endDate: null,
                minAmount: null, // Using Amount to align with total_amount key
                maxAmount: null, // Using Amount to align with total_amount key
                dateRange: 'all', // Used for UI only, startDate/endDate for filtering
            },
            sortConfig: { key: 'order_time', direction: SORT_DIRECTION.DESC },
            currentPage: 1,
            itemsPerPage: 8,
            isLoading: false,
            isRefreshing: false,
            error: null,

            // --- Selectors/Getters (Internal) ---
            getFilteredOrders: () => {
                const { orders, filters, sortConfig } = get();
                // Since page.js re-implements filtering/sorting in its useMemo for performance,
                // this internal getter might not be used, but it's good practice to keep it.
                let filtered = filterOrders(orders, filters);
                return sortOrders(filtered, sortConfig);
            },
            
            // --- Actions ---
            /**
             * Updates the filters and resets to page 1. (MISSING ACTION ADDED)
             */
            setFilters: (newFilters) => {
                set(state => ({
                    filters: {
                        ...state.filters,
                        // Clear old date filters when new ones are applied/cleared
                        startDate: null, 
                        endDate: null,
                        dateRange: 'all',
                        minAmount: null,
                        maxAmount: null,
                        // Apply new filters, overriding the cleared ones
                        ...newFilters,
                    },
                    currentPage: 1 // Important: reset to page 1 on filter change
                }));
            },

            /**
             * Sets the sort configuration and resets to page 1.
             */
            setSortConfig: (newSortConfig) => {
                set({ sortConfig: newSortConfig, currentPage: 1 });
            },

            // (Other actions like fetchOrders, updateOrderStatus, processPendingOrders, etc. from snippet are assumed complete)
            fetchOrders: async (forceRefresh = false) => {
                // ... implementation assumed complete ...
            },
            updateOrderStatus: (orderId, newStatus) => {
                // ... implementation assumed complete ...
            },
            processPendingOrders: () => {
                // ... implementation assumed complete ...
            },
            setCurrentPage: (page) => {
                set({ currentPage: page });
            },
            clearAllState: () => {
                set({
                    filters: {
                        order_status: 'all',
                        payment_status: 'all',
                        payment_method: 'all',
                        search: '',
                        startDate: null,
                        endDate: null,
                        minAmount: null,
                        maxAmount: null,
                        dateRange: 'all',
                    },
                    sortConfig: { key: 'order_time', direction: SORT_DIRECTION.DESC },
                    currentPage: 1
                });
            },
        }),
        {
            name: 'orders-storage',
            partialize: (state) => ({
                filters: state.filters,
                sortConfig: state.sortConfig,
                itemsPerPage: state.itemsPerPage
            })
        }
    )
);
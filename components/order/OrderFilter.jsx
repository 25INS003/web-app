"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Search, Filter, X, Calendar } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Card, CardContent } from "../ui/card";
import { useOrdersStore } from '@/store/ordersStore';

/**
 * Date range options for the filter dropdown.
 */
const dateRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last7", label: "Last 7 Days" },
    { value: "last30", label: "Last 30 Days" },
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
];

/**
 * Helper function to calculate startDate and endDate ISO strings based on dateRange selection.
 */
const getDateFilterParams = (dateRange) => {
    const filters = {};
    const now = new Date();

    // Helper to get start of day
    const getStartOfDay = (date) => new Date(new Date(date).setHours(0, 0, 0, 0));
    // Helper to get end of day (for endDate filter)
    const getEndOfDay = (date) => new Date(new Date(date).setHours(23, 59, 59, 999));

    switch (dateRange) {
        case 'today':
            filters.startDate = getStartOfDay(now).toISOString();
            // No endDate needed, as it filters up to current time
            break;
        case 'yesterday':
            const yesterdayStart = getStartOfDay(new Date());
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            const yesterdayEnd = getEndOfDay(yesterdayStart); // End of yesterday
            filters.startDate = yesterdayStart.toISOString();
            filters.endDate = yesterdayEnd.toISOString();
            break;
        case 'last7':
            const last7 = getStartOfDay(new Date());
            last7.setDate(last7.getDate() - 7);
            filters.startDate = last7.toISOString();
            break;
        case 'last30':
            const last30 = getStartOfDay(new Date());
            last30.setDate(last30.getDate() - 30);
            filters.startDate = last30.toISOString();
            break;
        case 'thisMonth':
            filters.startDate = getStartOfDay(new Date(now.getFullYear(), now.getMonth(), 1)).toISOString();
            break;
        case 'lastMonth':
            const lastMonthStart = getStartOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
            const lastMonthEnd = getEndOfDay(new Date(now.getFullYear(), now.getMonth(), 0)); // Last day of last month
            filters.startDate = lastMonthStart.toISOString();
            filters.endDate = lastMonthEnd.toISOString();
            break;
        default:
            // For 'all' or unknown, return empty filters
            break;
    }
    return filters;
};


/**
 * =================================================================
 * Main Component: OrderFilter
 * =================================================================
 */
export default function OrderFilter({
    filters = {},
    onFilterChange = () => { }, // Store setFilters
    pagination = {},
    processedOrdersCount = 0, // Count of orders after filtering/sorting from parent
    itemsPerPage = 8,
}) {
    // Access the clearAllState action directly from the store
    // Corrected store name: useOrdersStore
    const clearAllState = useOrdersStore(state => state.clearAllState);

    // State to hold user input *before* applying the filters
    const [localFilters, setLocalFilters] = useState({
        status: "All",
        minAmount: "", // Corrected from minPrice
        maxAmount: "", // Corrected from maxPrice
        search: "",
        dateRange: "all",
    });

    // State to track which filters are currently applied and displayed
    const [activeFilters, setActiveFilters] = useState(filters);

    // State to control the visibility of the advanced filter card

    // --- Derived Values ---
    const currentPage = pagination.currentPage || 1;
    // Calculate totalPages based on the count passed from the parent
    const totalPages = Math.ceil(processedOrdersCount / itemsPerPage) || 1;
    // --- END Derived Values ---

    /**
     * Synchronize local input state with external `filters` prop when it changes.
     */
    useEffect(() => {
        // We only want to set activeFilters for display
        const filtersToDisplay = { ...filters };
        // Clean up startDate/endDate from activeFilters if dateRange is 'all'
        if (filters.dateRange === 'all' || !filters.dateRange) {
            delete filtersToDisplay.startDate;
            delete filtersToDisplay.endDate;
        }

        setActiveFilters(filtersToDisplay);
        setLocalFilters({
            status: filters.status || "All",
            minAmount: filters.minAmount || "", // Corrected
            maxAmount: filters.maxAmount || "", // Corrected
            search: filters.search || "",
            dateRange: filters.dateRange || "all",
        });
    }, [filters]);


    /**
     * Processes the current local state, cleans up empty values,
     * updates active filters, and notifies the parent component (store).
     */
    const handleApplyFilters = useCallback(() => {
        // 1. Collect all potential filters
        const filtersToApply = {
            status: localFilters.status !== "All" ? localFilters.status : undefined,
            minAmount: localFilters.minAmount || undefined, // Corrected key
            maxAmount: localFilters.maxAmount || undefined, // Corrected key
            search: localFilters.search || undefined,
            dateRange: localFilters.dateRange !== "all" ? localFilters.dateRange : undefined,
            ...getDateFilterParams(localFilters.dateRange), // Calculate and add startDate/endDate
        };

        // 2. Create the final, clean filter object (no undefined/null/empty strings, except if explicitly needed to clear store state)
        const cleanFilters = Object.fromEntries(
            Object.entries(filtersToApply).filter(([key, value]) =>
                value !== undefined && value !== null && value !== ""
            )
        );

        // 3. Ensure startDate/endDate are explicitly cleared if dateRange is 'all'
        //    (This is important because `onFilterChange` in the store might merge, not replace)
        if (localFilters.dateRange === 'all') {
            cleanFilters.startDate = null;
            cleanFilters.endDate = null;
            // The UI display filter for 'dateRange' should be removed in this case
            delete cleanFilters.dateRange;
        }


        setActiveFilters(cleanFilters);
        // Calls the store's setFilters action, which also resets the page
        onFilterChange(cleanFilters);

        setIsFilterCardOpen(false);
    }, [localFilters, onFilterChange]);

    /**
     * Resets all local and active filters to their initial state.
     */
    const handleClearFilters = useCallback(() => {
        const defaultFilters = {
            status: "All",
            minAmount: "", // Corrected
            maxAmount: "", // Corrected
            search: "",
            dateRange: "all",
        };

        setLocalFilters(defaultFilters);
        setActiveFilters({});

        // Use the store action to clear all state (filters, sort, page)
        clearAllState();
    }, [clearAllState]);

    /**
     * Removes a single active filter and reapplies the remaining filters.
     */
    const removeActiveFilter = useCallback((filterKey) => {
        const newLocalFilters = { ...localFilters };
        if (filterKey === "status") {
            newLocalFilters.status = "All";
        } else if (filterKey === "dateRange") {
            newLocalFilters.dateRange = "all";
        } else if (filterKey === "minAmount" || filterKey === "maxAmount") { // Corrected
            newLocalFilters[filterKey] = "";
        } else if (filterKey === "search") {
            newLocalFilters.search = "";
        }
        setLocalFilters(newLocalFilters); // Update local input state

        // Derive the final clean filter object for the store (Re-using logic from handleApplyFilters)
        const filtersToApply = {
            status: newLocalFilters.status !== "All" ? newLocalFilters.status : undefined,
            minAmount: newLocalFilters.minAmount || undefined, // Corrected
            maxAmount: newLocalFilters.maxAmount || undefined, // Corrected
            search: newLocalFilters.search || undefined,
            dateRange: newLocalFilters.dateRange !== "all" ? newLocalFilters.dateRange : undefined,
            ...getDateFilterParams(newLocalFilters.dateRange),
        };

        const cleanFilters = Object.fromEntries(
            Object.entries(filtersToApply).filter(([key, value]) =>
                value !== undefined && value !== null && value !== ""
            )
        );

        if (newLocalFilters.dateRange === 'all') {
            cleanFilters.startDate = null;
            cleanFilters.endDate = null;
            delete cleanFilters.dateRange;
        }

        setActiveFilters(cleanFilters);
        // Calls the store's setFilters action, which handles resetting the page
        onFilterChange(cleanFilters);

    }, [localFilters, onFilterChange]);

    /**
     * Helper to retrieve the label for a date range value.
     */
    const getDateRangeLabel = useMemo(() => {
        return (dateRangeValue) => {
            return dateRangeOptions.find((d) => d.value === dateRangeValue)?.label || dateRangeValue;
        };
    }, []);


    return (
        // Use bg-card for theme consistency
        <Card className="bg-card border dark:border-border shadow-sm">
            <CardContent className="p-6">
                <div className="space-y-6">
                    {/* --- 1. Search Bar and Main Action Buttons --- */}
                    <div className="flex flex-col  sm:flex-row gap-4">

                        {/* Search Input */}
                        <div className="flex-1 relative min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search orders by ID, customer name, or customer ID..."
                                value={localFilters.search}
                                onChange={(e) =>
                                    setLocalFilters((prev) => ({ ...prev, search: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                                className="pl-10"
                            />
                        </div>

                        {/* Order Status Filter */}
                        <div className="space-y-3">
                            {/* Use text-muted-foreground for labels */}
                            <label className="absolute t-0 l-0 -translate-y-full text-sm font-medium text-muted-foreground ">
                                Order Status
                            </label>
                            <Select
                                value={localFilters.status}
                                onValueChange={(value) =>
                                    setLocalFilters((prev) => ({ ...prev, status: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="preparing">Preparing</SelectItem>
                                    <SelectItem value="ready">Ready</SelectItem>
                                    <SelectItem value="in_transit">In Transit</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    
                        {/* Date Range Filter */}
                        <div className="space-y-3">
                            {/* Use text-muted-foreground for labels */}
                            <label className="absolute t-0 l-0 -translate-y-full text-sm font-medium text-muted-foreground">
                                Date Range
                            </label>
                            <Select
                                value={localFilters.dateRange}
                                onValueChange={(value) =>
                                    setLocalFilters((prev) => ({ ...prev, dateRange: value }))
                                }
                            >
                                <SelectTrigger>
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Select Date Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dateRangeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Minimum Price Filter (Corrected to Amount) */}
                        <div className="space-y-3">
                            <label className="absolute t-0 l-0 -translate-y-full text-sm font-medium text-muted-foreground">
                                Min. Amount
                            </label>
                            <Input
                                type="number"
                                placeholder="Min Amount"
                                value={localFilters.minAmount} // Corrected
                                onChange={(e) =>
                                    setLocalFilters((prev) => ({ ...prev, minAmount: e.target.value })) // Corrected
                                }
                            />
                        </div>

                        {/* Maximum Price Filter (Corrected to Amount) */}
                        <div className="space-y-3">
                            <label className="absolute t-0 l-0 -translate-y-full text-sm font-medium text-muted-foreground">
                                Max. Amount
                            </label>
                            <Input
                                type="number"
                                placeholder="Max Amount"
                                value={localFilters.maxAmount} // Corrected
                                onChange={(e) =>
                                    setLocalFilters((prev) => ({ ...prev, maxAmount: e.target.value })) // Corrected
                                }
                            />
                        </div>

                        {/* Primary Apply Button */}
                        <Button onClick={handleApplyFilters} className="shrink-0">
                            Apply Filters
                        </Button>
                    </div>



                    {/* --- 2. Active Filters Display --- */}
                    {Object.keys(activeFilters).length > 0 && (
                        <div className="space-y-2">
                            {/* Use text-muted-foreground */}
                            <div className="text-sm font-medium text-muted-foreground">
                                Active Filters:
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                                {/* Filter Badges (already using theme-aware Badge component) */}

                                {/* Status Filter Badge */}
                                {activeFilters.status && activeFilters.status !== 'all' && (
                                    <Badge variant="secondary" className="gap-1">
                                        Status: {activeFilters.status}
                                        <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => removeActiveFilter("status")} />
                                    </Badge>
                                )}

                                {/* Date Range Filter Badge */}
                                {activeFilters.dateRange && (
                                    <Badge variant="secondary" className="gap-1">
                                        Date: {getDateRangeLabel(activeFilters.dateRange)}
                                        <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => removeActiveFilter("dateRange")} />
                                    </Badge>
                                )}

                                {/* Search Filter Badge */}
                                {activeFilters.search && (
                                    <Badge variant="secondary" className="gap-1">
                                        Search: "{activeFilters.search}"
                                        <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => removeActiveFilter("search")} />
                                    </Badge>
                                )}

                                {/* Minimum Amount Filter Badge (Corrected from minPrice) */}
                                {activeFilters.minAmount && (
                                    <Badge variant="secondary" className="gap-1">
                                        Min Amount: ${Number(activeFilters.minAmount).toFixed(2)}
                                        <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => removeActiveFilter("minAmount")} />
                                    </Badge>
                                )}

                                {/* Maximum Amount Filter Badge (Corrected from maxPrice) */}
                                {activeFilters.maxAmount && (
                                    <Badge variant="secondary" className="gap-1">
                                        Max Amount: ${Number(activeFilters.maxAmount).toFixed(2)}
                                        <X className="h-3 w-3 cursor-pointer ml-1" onClick={() => removeActiveFilter("maxAmount")} />
                                    </Badge>
                                )}

                                {/* Clear All Button */}
                                <Button
                                    variant="ghost"
                                    onClick={handleClearFilters}
                                    className="h-7 text-xs px-2 py-1 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                >
                                    Clear All
                                </Button>
                            </div>
                        </div>
                    )}


                    {/* --- 4. Count and Pagination Info --- */}
                    <div className="flex flex-wrap items-center justify-between pt-2">
                        {/* Use text-muted-foreground for summary text */}
                        <div className="text-sm text-muted-foreground">
                            <span className="font-medium">{processedOrdersCount}</span> orders found

                            {/* Summary of Price Filters (if applied) */}
                            {activeFilters.minAmount && ( // Corrected
                                <span className="ml-2">
                                    • Min: <span className="font-medium">${Number(activeFilters.minAmount).toFixed(2)}</span>
                                </span>
                            )}
                            {activeFilters.maxAmount && ( // Corrected
                                <span className="ml-2">
                                    • Max: <span className="font-medium">${Number(activeFilters.maxAmount).toFixed(2)}</span>
                                </span>
                            )}
                        </div>
                        {/* Summary of current page and total pages */}
                        <div className="text-sm text-muted-foreground">
                            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
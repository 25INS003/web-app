"use client";
import { useState, useEffect, useMemo } from "react";
import { Search, X, Calendar } from "lucide-react";
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
import { Card, CardContent } from "../ui/card";

const dateRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last7", label: "Last 7 Days" },
    { value: "last30", label: "Last 30 Days" },
    { value: "thisMonth", label: "This Month" },
];

const getISODates = (range) => {
    const now = new Date();
    const startOfDay = (d) => new Date(d.setHours(0,0,0,0)).toISOString();
    const endOfDay = (d) => new Date(d.setHours(23,59,59,999)).toISOString();

    if (range === 'today') return { startDate: startOfDay(new Date()) };
    
    if (range === 'yesterday') {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return { startDate: startOfDay(d), endDate: endOfDay(d) };
    }
    // ... Add other ranges logic as needed
    return {};
};

export default function OrderFilter({
    filters = {},
    onFilterChange,
    totalResults = 0,
}) {
    // Local state for inputs before "Apply"
    const [local, setLocal] = useState({
        search: "",
        status: "all",
        dateRange: "all",
        minAmount: "",
        maxAmount: "",
        ...filters
    });

    const hasActiveFilters = useMemo(() => {
        return Object.keys(filters).length > 0 && 
              (filters.search || filters.minAmount || filters.status !== 'all' || filters.dateRange !== 'all');
    }, [filters]);

    const handleApply = () => {
        const dateParams = getISODates(local.dateRange);
        const cleanFilters = {
            ...local,
            ...dateParams,
            // Ensure status 'all' is removed so backend doesn't filter by "all" string
            status: local.status === 'all' ? undefined : local.status, 
            dateRange: local.dateRange === 'all' ? undefined : local.dateRange
        };
        
        // Remove empty keys
        Object.keys(cleanFilters).forEach(key => {
            if (cleanFilters[key] === "" || cleanFilters[key] === undefined) delete cleanFilters[key];
        });

        onFilterChange(cleanFilters);
    };

    const handleClear = () => {
        const resetState = {
            search: "",
            status: "all",
            dateRange: "all",
            minAmount: "",
            maxAmount: ""
        };
        setLocal(resetState);
        onFilterChange({}); // Clear filters in parent
    };

    return (
        <Card className="bg-white dark:bg-slate-800/60 border dark:border-border shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                    
                    {/* Top Row: Search & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-5 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Order #, Customer Name/ID..."
                                className="pl-10"
                                value={local.search || ""}
                                onChange={(e) => setLocal(p => ({ ...p, search: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            />
                        </div>

                        <div className="md:col-span-3">
                            <Select 
                                value={local.status || "all"} 
                                onValueChange={(val) => setLocal(p => ({ ...p, status: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="preparing">Preparing</SelectItem>
                                    <SelectItem value="ready">Ready</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2">
                             <Select 
                                value={local.dateRange || "all"} 
                                onValueChange={(val) => setLocal(p => ({ ...p, dateRange: val }))}
                            >
                                <SelectTrigger>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Date" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dateRangeOptions.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="md:col-span-2 flex gap-2">
                            <Button className="w-full" onClick={handleApply}>Apply</Button>
                        </div>
                    </div>

                    {/* Active Filters Badges */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                            <span className="text-xs text-muted-foreground self-center">Active:</span>
                            {filters.search && (
                                <Badge variant="secondary" className="gap-1">
                                    Search: {filters.search}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => {
                                        setLocal(p => ({...p, search: ""}));
                                        onFilterChange({...filters, search: undefined});
                                    }}/>
                                </Badge>
                            )}
                            {filters.status && filters.status !== 'all' && (
                                <Badge variant="secondary" className="gap-1">
                                    Status: {filters.status}
                                </Badge>
                            )}
                             <Button variant="ghost" size="sm" className="h-5 text-xs text-red-500" onClick={handleClear}>
                                Clear All
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
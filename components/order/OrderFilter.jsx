"use client";
import { useState, useMemo } from "react";
import { Search, X, Calendar } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils"; // Assuming you have a utility function for class names

export default function OrderFilter({ filters = {}, onFilterChange }) {
    // Local state allows typing without triggering API call immediately
    const [local, setLocal] = useState({
        search: "",
        status: "all",
        dateRange: "all",
        ...filters
    });

    const hasActiveFilters = useMemo(() => {
        return local.search || local.status !== 'all' || local.dateRange !== 'all';
    }, [local]);

    const getDateParams = (range) => {
        const now = new Date();
        const startOfDay = (d) => new Date(d.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = (d) => new Date(d.setHours(23, 59, 59, 999)).toISOString();

        if (range === 'today') {
            return { startDate: startOfDay(new Date()) };
        }
        if (range === 'yesterday') {
            const yesterdayStart = new Date(); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            const todayStart = new Date(); // Today's date, which startOfDay will set to 00:00:00

            return {
                startDate: startOfDay(yesterdayStart),
                endDate: startOfDay(todayStart)
            };
        }
        return {};
    };

    const handleApply = () => {
        const dateParams = getDateParams(local.dateRange);

        // Use local state values for the filter object
        const newFilters = {
            search: local.search || undefined,
            order_status: local.status !== 'all' ? local.status : undefined,
            dateRange: local.dateRange !== 'all' ? local.dateRange : undefined,
            ...dateParams,
        };

        // Clean up undefined/null values
        Object.keys(newFilters).forEach(k => (newFilters[k] === "" || newFilters[k] === undefined) && delete newFilters[k]);

        onFilterChange(newFilters);
    };

    const handleClear = () => {
        const reset = { search: "", status: "all", dateRange: "all" };
        setLocal(reset);
        onFilterChange({});
    };

    // Helper for select dropdowns to handle dark theme
    const selectTriggerClass = "dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-700/80";
    const selectContentClass = "dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100";
    const selectItemClass = "dark:hover:bg-slate-700 dark:focus:bg-slate-700 dark:data-[state=checked]:bg-slate-700/90";

    return (
        // DARK THEME FIX: Card container background and border
        <Card className="bg-white dark:bg-slate-800/60 dark:border-slate-700 shadow-sm">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 relative">
                        {/* DARK THEME FIX: Icon color */}
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-slate-400" />
                        {/* DARK THEME FIX: Input field */}
                        <Input
                            placeholder="Search Order ID or Customer Name..."
                            className="pl-10 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                            value={local.search}
                            onChange={e => setLocal(p => ({ ...p, search: e.target.value }))}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <Select value={local.status} onValueChange={v => setLocal(p => ({ ...p, status: v }))}>
                            <SelectTrigger className={selectTriggerClass}>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className={selectContentClass}>
                                <SelectItem value="all" className={selectItemClass}>All Status</SelectItem>
                                <SelectItem value="pending" className={selectItemClass}>Pending</SelectItem>
                                <SelectItem value="confirmed" className={selectItemClass}>Confirmed</SelectItem>
                                <SelectItem value="preparing" className={selectItemClass}>Preparing</SelectItem>
                                <SelectItem value="ready" className={selectItemClass}>Ready</SelectItem>
                                <SelectItem value="shipped" className={selectItemClass}>Shipped</SelectItem>
                                <SelectItem value="delivered" className={selectItemClass}>Delivered</SelectItem>
                                <SelectItem value="cancelled" className={selectItemClass}>Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-2">
                        <Select value={local.dateRange} onValueChange={v => setLocal(p => ({ ...p, dateRange: v }))}>
                            <SelectTrigger className={selectTriggerClass}>
                                {/* DARK THEME FIX: Icon color */}
                                <Calendar className="h-4 w-4 mr-2 dark:text-slate-400" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={selectContentClass}>
                                <SelectItem value="all" className={selectItemClass}>All Time</SelectItem>
                                <SelectItem value="today" className={selectItemClass}>Today</SelectItem>
                                <SelectItem value="yesterday" className={selectItemClass}>Yesterday</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-2">
                        {/* DARK THEME FIX: Button primary color */}
                        <Button className="w-full" onClick={handleApply}>Apply Filters</Button>
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                        {/* DARK THEME FIX: Badge secondary color */}
                        {local.search && <Badge variant="secondary" className="dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">Search: {local.search}</Badge>}
                        {local.status !== 'all' && <Badge variant="secondary" className="dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">Status: {local.status}</Badge>}
                        {local.dateRange !== 'all' && <Badge variant="secondary" className="dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">Date: {local.dateRange}</Badge>}

                        {/* DARK THEME FIX: Ghost button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-slate-700/50"
                            onClick={handleClear}
                        >
                            <X className="w-3 h-3 mr-1" /> Clear All Filters
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
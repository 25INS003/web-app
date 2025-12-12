"use client";
import { useState, useMemo } from "react";
import { Search, X, Calendar } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent } from "../ui/card";

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
        if (range === 'today') return { startDate: startOfDay(new Date()) };
        if (range === 'yesterday') {
            const d = new Date(); d.setDate(d.getDate() - 1);
            return { startDate: startOfDay(d), endDate: startOfDay(new Date()) };
        }
        return {};
    };

    const handleApply = () => {
        const dateParams = getDateParams(local.dateRange);
        const clean = {
            ...local,
            ...dateParams,
            status: local.status === 'all' ? undefined : local.status,
            dateRange: local.dateRange === 'all' ? undefined : local.dateRange
        };
        // Clean up empty strings
        Object.keys(clean).forEach(k => (clean[k] === "" || clean[k] === undefined) && delete clean[k]);

        onFilterChange(clean);
    };

    const handleClear = () => {
        const reset = { search: "", status: "all", dateRange: "all" };
        setLocal(reset);
        onFilterChange({});
    };

    return (
        <Card className="bg-white dark:bg-slate-800/60 border shadow-sm">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Order ID..."
                            className="pl-10"
                            value={local.search}
                            onChange={e => setLocal(p => ({ ...p, search: e.target.value }))}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <Select value={local.status} onValueChange={v => setLocal(p => ({ ...p, status: v }))}>
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-2">
                        <Select value={local.dateRange} onValueChange={v => setLocal(p => ({ ...p, dateRange: v }))}>
                            <SelectTrigger><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-2">
                        <Button className="w-full" onClick={handleApply}>Apply</Button>
                    </div>
                </div>
                {hasActiveFilters && (
                    <div className="mt-4 flex gap-2">
                        {local.search && <Badge variant="secondary">Search: {local.search}</Badge>}
                        {local.status !== 'all' && <Badge variant="secondary">Status: {local.status}</Badge>}
                        <Button variant="ghost" size="sm" className="h-5 text-xs text-red-500" onClick={handleClear}>Clear All</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
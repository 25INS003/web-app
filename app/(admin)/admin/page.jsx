"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
    Store, 
    Users, 
    TrendingUp, 
    AlertCircle,
    Activity,
    Database,
    Server,
    HardDrive,
    Layers,
    ArrowRight,
    Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported if used
import apiClient from "@/api/apiClient";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalShops: 0,
        pendingApprovals: 0,
        activeOwners: 0,
        totalRevenue: 0,
    });
     const [health, setHealth] = useState({
        database: { status: "Checking...", latency: "...", state: 0 },
        server: { uptime: 0, memoryUsage: "...", storageUsage: "...", cpuLoad: 0 },
        timestamp: null
    });
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch in parallel
                const [shopsRes, pendingRes, salesRes, healthRes] = await Promise.all([
                    apiClient.get("/admin/shops"),
                    apiClient.get("/admin/shops/pending-approval"),
                    apiClient.get("/reports/sales?groupBy=day&startDate=" + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
                     apiClient.get("/admin/system/health").catch(() => ({ data: { data: null } }))
                ]);

                const shops = shopsRes.data.data || [];
                const pendingShops = pendingRes.data.data || [];
                const salesData = salesRes.data.data.data || []; 
                const salesSummary = salesRes.data.data.summary || {};
                const healthData = healthRes.data.data || null;

                // Process Chart Data
                const processedChartData = salesData.map(item => ({
                    name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    revenue: item.totalSales || 0
                }));

                const uniqueOwners = new Set(shops.map(s => s.owner_id?._id)).size;

                setStats({
                    totalShops: shops.length,
                    pendingApprovals: pendingShops.length,
                    activeOwners: uniqueOwners || shops.length,
                    totalRevenue: salesSummary.totalRevenue || 0
                });

                if (healthData) {
                    setHealth(healthData);
                } else {
                     setHealth({
                        database: { status: "Unknown", latency: "-", state: 0 },
                        server: { uptime: 0, memoryUsage: "-", storageUsage: "-", cpuLoad: 0 },
                        timestamp: new Date()
                    });
                }

                setChartData(processedChartData);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statCards = [
        { 
            title: "Total Shops", 
            value: stats.totalShops.toLocaleString(), 
            icon: Store, 
            color: "text-blue-500", 
            bg: "bg-blue-500/10",
            border: "group-hover:border-blue-500/50",
            shadow: "shadow-blue-500/10"
        },
        { 
            title: "Active Owners", 
            value: stats.activeOwners.toLocaleString(), 
            icon: Users, 
            color: "text-purple-500", 
            bg: "bg-purple-500/10",
            border: "group-hover:border-purple-500/50",
            shadow: "shadow-purple-500/10"
        },
        { 
            title: "Pending Approvals", 
            value: stats.pendingApprovals.toLocaleString(), 
            icon: AlertCircle, 
            color: stats.pendingApprovals > 0 ? "text-amber-500" : "text-slate-500", 
            bg: stats.pendingApprovals > 0 ? "bg-amber-500/10" : "bg-slate-500/10",
            border: stats.pendingApprovals > 0 ? "group-hover:border-amber-500/50" : "group-hover:border-slate-500/50",
            shadow: stats.pendingApprovals > 0 ? "shadow-amber-500/10" : "shadow-slate-500/10"
        },
        { 
            title: "Total Revenue", 
            value: `₹${stats.totalRevenue.toLocaleString()}`, 
            icon: TrendingUp, 
            color: "text-emerald-500", 
            bg: "bg-emerald-500/10",
            border: "group-hover:border-emerald-500/50",
            shadow: "shadow-emerald-500/10"
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 min-h-[calc(100vh-100px)] pb-20"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                        Welcome back, Admin. Here's what needs your attention today.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        v2.0.1
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <motion.div 
                        key={idx} 
                        variants={itemVariants} 
                        whileHover={{ y: -5 }} 
                        className="h-full group"
                    >
                        <Card className={`h-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl dark:shadow-2xl ${stat.shadow} transition-all duration-300 ${stat.border}`}>
                            <CardContent className="p-6 flex items-center justify-between h-full relative overflow-hidden">
                                {/* Decorator Blob */}
                                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl opacity-50`} />
                                
                                <div className="relative z-10">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 tracking-wide uppercase text-[10px]">{stat.title}</p>
                                    <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">
                                        {isLoading ? "-" : stat.value}
                                    </h3>
                                </div>
                                <motion.div 
                                    whileHover={{ rotate: 8, scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className={`p-4 rounded-2xl ${stat.bg} relative z-10`}
                                >
                                    <stat.icon className={`w-7 h-7 ${stat.color}`} />
                                </motion.div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts & Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col h-full">
                    <Card className="flex-1 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl dark:shadow-black/20 min-h-[450px]">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <Activity className="w-5 h-5 text-emerald-500" />
                                </div>
                                Revenue Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[360px] pt-6">
                            {isLoading ? (
                                <div className="h-full w-full flex items-center justify-center text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                                        <span className="text-sm">Loading data...</span>
                                    </div>
                                </div>
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#94a3b8" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis 
                                            stroke="#94a3b8" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                            tickFormatter={(value) => `₹${value}`}
                                            dx={-10}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                                border: 'none', 
                                                borderRadius: '12px',
                                                color: '#fff',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                padding: '12px'
                                            }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#10b981" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorRevenue)" 
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                                        <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-sm">No revenue data available for this period.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
                
                {/* System Health */}
                <motion.div variants={itemVariants} className="flex flex-col h-full">
                    <Card className="flex-1 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl dark:shadow-black/20 min-h-[450px]">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Zap className="w-5 h-5 text-blue-500" />
                                </div>
                                System Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col h-[360px] justify-between pt-6">
                             <div className="space-y-8">
                                {/* Database Card */}
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Database className="w-4 h-4 text-purple-500" />
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Database</span>
                                        </div>
                                        <Badge className={`${
                                            health.database.state === 1 
                                            ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                                            : "bg-red-500 text-white shadow-red-500/20"
                                        } shadow-lg border-0`}>
                                            {health.database.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Latency: <span className="font-mono text-slate-900 dark:text-white">{health.database.latency}</span>
                                    </div>
                                </div>

                                {/* Resource Usage */}
                                <div className="space-y-5">
                                    {/* Memory */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <HardDrive className="w-4 h-4" />
                                                <span>Memory Usage</span>
                                            </div>
                                            <span className="font-mono font-medium text-slate-900 dark:text-white">{health.server.storageUsage}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: health.server.storageUsage }}
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600" 
                                            />
                                        </div>
                                    </div>

                                    {/* API Load (Mock visual) */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Activity className="w-4 h-4" />
                                                <span>API Load</span>
                                            </div>
                                            <span className="font-mono font-medium text-slate-900 dark:text-white">Optimal</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 w-[15%]" />
                                        </div>
                                    </div>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-3 mt-4">
                                <Button 
                                    onClick={() => router.push("/admin/shops")}
                                    className="h-10 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
                                >
                                    View Shops <ArrowRight className="w-3 h-3 ml-2 opacity-50" />
                                </Button>
                                <Button 
                                    onClick={() => router.push("/admin/categories")}
                                    className="h-10 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
                                >
                                    Categories <ArrowRight className="w-3 h-3 ml-2 opacity-50" />
                                </Button>
                             </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

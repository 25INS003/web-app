"use client";

import { useState } from "react";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
    FileText, 
    Download, 
    Users, 
    ShoppingBag, 
    TrendingUp,
    Loader2,
    Calendar,
    BarChart3,
    PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminReportsPage() {
    const [downloading, setDownloading] = useState(null); // 'sales', 'users', 'inventory', or null

    const reports = [
        {
            id: "sales",
            title: "Sales Report",
            description: "Comprehensive sales volume, revenue breakdown, and trends across all shops.",
            icon: TrendingUp,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "group-hover:border-blue-500/50",
            shadow: "shadow-blue-500/10"
        },
        {
            id: "users",
            title: "User Growth",
            description: "New user registrations, active session details, and customer retention metrics.",
            icon: Users,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "group-hover:border-purple-500/50",
            shadow: "shadow-purple-500/10"
        },
        {
            id: "inventory",
            title: "Inventory Status",
            description: "Current stock levels, low stock alerts, and product category distribution.",
            icon: ShoppingBag,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "group-hover:border-amber-500/50",
            shadow: "shadow-amber-500/10"
        }
    ];

    const handleDownload = async (type) => {
        setDownloading(type);
        try {
            let endpoint = "";
            let filename = "";

            switch (type) {
                case "sales":
                    endpoint = "/reports/sales?format=csv";
                    filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                case "users":
                    endpoint = "/reports/customer?format=csv";
                    filename = `user_growth_${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                case "inventory":
                    endpoint = "/reports/inventory?format=csv";
                    filename = `inventory_status_${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                default:
                    return;
            }

            const response = await apiClient.get(endpoint, {
                responseType: "blob", // Important for binary data
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success("Report downloaded successfully");
        } catch (error) {
            console.error("Download error:", error);
            toast.error(error.response?.data?.message || "Failed to download report");
        } finally {
            setDownloading(null);
        }
    };

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
            className="space-y-8 min-h-[80vh]"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-emerald-500/10">
                            <FileText className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Reports & Analytics
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg ml-1">
                        Export detailed system insights and performance metrics.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Calendar className="w-4 h-4" />
                    <span>Today: {new Date().toLocaleDateString()}</span>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {reports.map((report) => (
                    <motion.div 
                        key={report.id} 
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className="group h-full"
                    >
                        <Card className={`h-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl dark:shadow-2xl hover:shadow-2xl transition-all duration-300 ${report.border} overflow-hidden cursor-default relative`}>
                            {/* Decorative Background Blob */}
                            <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full ${report.bg} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                            
                            <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <motion.div 
                                            whileHover={{ rotate: 8, scale: 1.1 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                            className={`p-4 rounded-2xl ${report.bg} shadow-sm ring-1 ring-inset ring-black/5`}
                                        >
                                            <report.icon className={`h-8 w-8 ${report.color}`} />
                                        </motion.div>
                                        
                                        {/* Mock Visual Element (Chart/Graph icon) for aesthetic */}
                                        <div className="text-slate-200 dark:text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-4 duration-300">
                                            {report.id === 'sales' && <BarChart3 className="w-12 h-12" />}
                                            {report.id === 'users' && <PieChart className="w-12 h-12" />}
                                            {report.id === 'inventory' && <FileText className="w-12 h-12" />}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {report.title}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed min-h-[3rem]">
                                        {report.description}
                                    </p>
                                </div>

                                <Button 
                                    onClick={() => handleDownload(report.id)}
                                    disabled={downloading === report.id}
                                    className="w-full mt-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                                >
                                    {downloading === report.id ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Generating CSV...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                                            Download CSV Report
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

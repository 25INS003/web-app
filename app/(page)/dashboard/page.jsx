"use client";

import { motion, AnimatePresence } from "framer-motion";
import TotalProfitCard from "@/components/dashboard/TotalProfitCard";
import BestSellingProducts from "@/components/dashboard/BestSellingProducts";
import SalesPerformanceChart from "@/components/dashboard/SalesPerformanceChart";
import OrderStatusCard from "@/components/dashboard/OrderStatusCard";
import TotalCustomersCard from "@/components/dashboard/TotalCustomersCard";
import AvgOrderValueCard from "@/components/dashboard/AvgOrderValueCard";
import AdvancedAnalytics from "@/components/dashboard/AdvancedAnalytics";
import { useEffect, useState } from "react";
import apiClient from "@/api/apiClient";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { LayoutDashboard, BarChart3 } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15 
    }
  }
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchStats = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const res = await apiClient.get("/shop-owners/dashboard-stats");
        setStats(res.data.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchStats(refreshTrigger === 0 && !stats);
  }, [refreshTrigger]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
      : "http://localhost:8000";

    const socket = io(socketUrl, {
      withCredentials: true // Ensure cookies are sent if needed
    });

    // Store socket globally for room joining after stats load
    if (typeof window !== 'undefined') {
      window.dashboardSocket = socket;
    }

    socket.on("connect", () => {
      // If we already have stats with shopIds, join immediately
      if (stats?.overview?.shopIds && stats.overview.shopIds.length > 0) {
        stats.overview.shopIds.forEach(shopId => {
           socket.emit("join-shop", shopId);
        });
      }
    });

    socket.on("new-order", (data) => {
      toast.info("New Order Received!", {
        description: `Order #${data.orderId} - ₹${data.amount} (${data.shopName})`,
        duration: 5000,
      });
      // Trigger refresh immediately
      setRefreshTrigger((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
      if (typeof window !== 'undefined') {
        window.dashboardSocket = null;
      }
    };
  }, []); // Only run once on mount

  // Join shop rooms when stats load
  useEffect(() => {
    if (stats?.overview?.shopIds && stats.overview.shopIds.length > 0) {
      const socket = window.dashboardSocket;
      if (socket && socket.connected) {
        stats.overview.shopIds.forEach(shopId => {
          socket.emit("join-shop", shopId);
        });
      }
    }
  }, [stats?.overview?.shopIds]);

  // Polling fallback
  useEffect(() => {
    const interval = setInterval(() => {
        setRefreshTrigger(prev => prev + 1);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Dashboard Content */}
      <motion.div 
        className="p-4 md:p-6 transition-colors duration-300"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-slate-600 dark:text-gray-400 text-sm mt-1">
              Welcome to your sales overview
            </p>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              showAdvanced 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {showAdvanced ? (
              <>
                <LayoutDashboard className="w-4 h-4" />
                Main View
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Advanced Insights
              </>
            )}
          </button>
        </motion.div>

        {/* Content Toggle with Smooth Transitions */}
        <AnimatePresence mode="wait">
          {!showAdvanced ? (
            <motion.div
              key="main-dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Row 1: Profit + Top Products */}
              <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                  <TotalProfitCard data={stats?.overview} loading={loading} />
                </div>
                <div className="col-span-12 md:col-span-8 lg:col-span-9">
                  <BestSellingProducts data={stats?.topProducts} loading={loading} />
                </div>
              </div>

              {/* Row 2: Sales Performance Chart */}
              <div className="mb-4">
                <SalesPerformanceChart 
                  data={stats?.salesTrend} 
                  monthlyData={stats?.monthlySalesTrend} 
                  yearlyData={stats?.yearlySalesTrend} 
                  overview={stats?.overview}
                  loading={loading} 
                />
              </div>

              {/* Row 3: Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OrderStatusCard data={stats?.overview} loading={loading} />
                <TotalCustomersCard data={stats?.overview} loading={loading} />
                <AvgOrderValueCard data={stats?.overview} loading={loading} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="advanced-analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <AdvancedAnalytics stats={stats} loading={loading} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
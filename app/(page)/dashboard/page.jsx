"use client";

import { useTheme } from "@/store/themeStore";
import ThemeToggle from "@/components/ui/ThemeToggle";
import TotalProfitCard from "@/components/dashboard/TotalProfitCard";
import BestSellingProducts from "@/components/dashboard/BestSellingProducts";
import SalesPerformanceChart from "@/components/dashboard/SalesPerformanceChart";
import OrderStatusCard from "@/components/dashboard/OrderStatusCard";
import TotalCustomersCard from "@/components/dashboard/TotalCustomersCard";
import AvgOrderValueCard from "@/components/dashboard/AvgOrderValueCard";

export default function DashboardPage() {
  const { isDark } = useTheme();
  
  return (
    <div className={`h-[calc(100vh-4rem)] overflow-hidden ${isDark ? 'bg-black' : 'bg-gray-50'} p-4 transition-colors duration-300`}>
      {/* Header with Theme Toggle */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Dashboard
          </h1>
          <p className={`${isDark ? 'text-gray-500' : 'text-gray-600'} text-sm`}>
            Welcome to your sales overview
          </p>
        </div>
        
        <ThemeToggle />
      </div>

      {/* Row 1: Profit + Top Products */}
      <div className="grid grid-cols-12 gap-4 mb-3">
        <div className="col-span-3">
          <TotalProfitCard />
        </div>
        <div className="col-span-9">
          <BestSellingProducts />
        </div>
      </div>

      {/* Row 2: Sales Performance Chart */}
      <div className="mb-3">
        <SalesPerformanceChart />
      </div>

      {/* Row 3: Additional Stats */}
      <div className="grid grid-cols-3 gap-4">
        <OrderStatusCard />
        <TotalCustomersCard />
        <AvgOrderValueCard />
      </div>
    </div>
  );
}
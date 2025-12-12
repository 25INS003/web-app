"use client";

import { useRouter } from "next/navigation";
import TotalProfitCard from "@/components/dashboard/TotalProfitCard";
import BestSellingProducts from "@/components/dashboard/BestSellingProducts";
import SalesPerformanceChart from "@/components/dashboard/SalesPerformanceChart";
import OrderStatusCard from "@/components/dashboard/OrderStatusCard";
import TotalCustomersCard from "@/components/dashboard/TotalCustomersCard";
import AvgOrderValueCard from "@/components/dashboard/AvgOrderValueCard";

export default function DashboardPage() {
  const router = useRouter(); 

  return (
    <div className="min-h-screen">

      {/* Dashboard Content */}
      <div className="p-4 transition-colors duration-300">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-gray-400 text-sm">
            Welcome to your sales overview
          </p>
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
    </div>
  );
}
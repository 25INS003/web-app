"use client";

import { ShoppingCart } from "lucide-react";
import { useTheme } from "@/store/themeStore";

export default function AvgOrderValueCard() {
  const { isDark } = useTheme();
  
  // TODO: Replace with API call
  // Example: const { data } = useSWR('/api/dashboard/order-value', fetcher);
  const orderData = {
    avgValue: 156.80,
    percentage: 5.4,
    thisMonth: 164.20,
    lastMonth: 149.60
  };
  
  return (
    <div className={`${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30' 
        : 'bg-white border-gray-200'
    } border rounded-2xl p-5 shadow-sm transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'} rounded-xl`}>
          <ShoppingCart className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isDark 
            ? 'text-orange-400 bg-orange-500/10' 
            : 'text-orange-600 bg-orange-50'
        }`}>
          +{orderData.percentage}%
        </span>
      </div>
      <h3 className={`${isDark ? 'text-gray-500' : 'text-gray-600'} text-xs mb-1`}>
        Avg Order Value
      </h3>
      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
        ₹{orderData.avgValue}
      </p>
      <div className="flex items-center gap-4 mt-3">
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>This Month</p>
          <p className={`text-sm font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
            ₹{orderData.thisMonth}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>Last Month</p>
          <p className={`text-sm font-semibold ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            ₹{orderData.lastMonth}
          </p>
        </div>
      </div>
    </div>
  );
}
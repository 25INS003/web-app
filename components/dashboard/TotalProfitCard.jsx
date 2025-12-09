"use client";

import { BadgeIndianRupee } from "lucide-react";
import { useTheme } from "@/store/themeStore";

export default function TotalProfitCard() {
  const { isDark } = useTheme();
  
  // TODO: Replace with API call
  // Example: const { data } = useSWR('/api/dashboard/profit', fetcher);
  const profitData = {
    total: 12304,
    percentage: 12.5,
    returnAmount: 1230
  };
  
  return (
    <div className={`${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30' 
        : 'bg-white border-gray-200'
    } border rounded-2xl p-5 shadow-sm transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} rounded-xl`}>
          <BadgeIndianRupee className={`w-7 h-7 ${isDark ? 'text-white' : 'text-blue-600'}`} />
        </div>
        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
          +{profitData.percentage}%
        </span>
      </div>
      <h3 className={`${isDark ? 'text-gray-500' : 'text-gray-600'} text-xs mb-1`}>
        Total Profit
      </h3>
      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        ₹{profitData.total.toLocaleString()}
      </p>
      <p className={`${isDark ? 'text-gray-600' : 'text-gray-500'} text-xs mt-2`}>
        Return +₹{profitData.returnAmount.toLocaleString()}
      </p>
    </div>
  );
}
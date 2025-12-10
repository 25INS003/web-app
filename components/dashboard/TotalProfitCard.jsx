"use client";

import { BadgeIndianRupee } from "lucide-react";

export default function TotalProfitCard() {
  
  const profitData = {
    total: 12304,
    percentage: 12.5,
    returnAmount: 1230
  };
  
  return (
    <div className="border rounded-2xl p-5 shadow-sm transition-colors duration-300 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-blue-900/30">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
          <BadgeIndianRupee className="w-7 h-7 text-blue-600 dark:text-white" />
        </div>
        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
          +{profitData.percentage}%
        </span>
      </div>
      <h3 className="text-gray-600 dark:text-gray-500 text-xs mb-1">
        Total Profit
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        ₹{profitData.total.toLocaleString()}
      </p>
      <p className="text-gray-500 dark:text-gray-600 text-xs mt-2">
        Return +₹{profitData.returnAmount.toLocaleString()}
      </p>
    </div>
  );
}
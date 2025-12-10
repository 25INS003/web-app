"use client";

import { ShoppingCart } from "lucide-react";

export default function AvgOrderValueCard() {
  
  const orderData = {
    avgValue: 156.80,
    percentage: 5.4,
    thisMonth: 164.20,
    lastMonth: 149.60
  };
  
  return (
    <div className="border rounded-2xl p-5 shadow-sm transition-colors 
                    duration-300 bg-white dark:bg-gradient-to-br 
                    dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-blue-900/30">

      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
          <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full text-orange-600 
                          dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10">
          +{orderData.percentage}%
        </span>
      </div>
      <h3 className="text-gray-600 dark:text-gray-500 text-xs mb-1">
        Avg Order Value
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        ₹{orderData.avgValue}
      </p>
      <div className="flex items-center gap-4 mt-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-600">This Month</p>
          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            ₹{orderData.thisMonth}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-600">Last Month</p>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-500">
            ₹{orderData.lastMonth}
          </p>
        </div>
      </div>
    </div>
  );
}
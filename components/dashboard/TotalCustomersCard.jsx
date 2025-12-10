"use client";

import { Users } from "lucide-react";

export default function TotalCustomersCard() {
  
  const customerData = {
    total: 8549,
    percentage: 23,
    newCustomers: 342,
    returningCustomers: 8207
  };
  
  return (
    <div className="border rounded-2xl p-5 shadow-sm transition-colors duration-300 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-blue-900/30">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10">
          +{customerData.percentage}%
        </span>
      </div>
      <h3 className="text-gray-600 dark:text-gray-500 text-xs mb-1">
        Total Customers
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {customerData.total.toLocaleString()}
      </p>
      <div className="flex items-center gap-4 mt-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-600">New</p>
          <p className="text-sm font-semibold text-green-500">
            +{customerData.newCustomers}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-600">Returning</p>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {customerData.returningCustomers.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
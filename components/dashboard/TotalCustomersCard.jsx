"use client";

import { Users } from "lucide-react";
import { useTheme } from "@/store/themeStore";

export default function TotalCustomersCard() {
  const { isDark } = useTheme();
  
  // TODO: Replace with API call
  // Example: const { data } = useSWR('/api/dashboard/customers', fetcher);
  const customerData = {
    total: 8549,
    percentage: 23,
    newCustomers: 342,
    returningCustomers: 8207
  };
  
  return (
    <div className={`${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30' 
        : 'bg-white border-gray-200'
    } border rounded-2xl p-5 shadow-sm transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'} rounded-xl`}>
          <Users className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isDark 
            ? 'text-purple-400 bg-purple-500/10' 
            : 'text-purple-600 bg-purple-50'
        }`}>
          +{customerData.percentage}%
        </span>
      </div>
      <h3 className={`${isDark ? 'text-gray-500' : 'text-gray-600'} text-xs mb-1`}>
        Total Customers
      </h3>
      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
        {customerData.total.toLocaleString()}
      </p>
      <div className="flex items-center gap-4 mt-3">
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>New</p>
          <p className="text-sm font-semibold text-green-500">
            +{customerData.newCustomers}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>Returning</p>
          <p className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {customerData.returningCustomers.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
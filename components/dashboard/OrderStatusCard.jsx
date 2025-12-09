"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTheme } from "@/store/themeStore";

export default function OrderStatusCard() {
  const { isDark } = useTheme();
  
  // TODO: Replace with API call
  // Example: const { data: orderStatusData } = useSWR('/api/dashboard/orders', fetcher);
  const orderStatusData = [
    { name: "Completed", value: 65, color: "#10b981" },
    { name: "Pending", value: 25, color: "#f59e0b" },
    { name: "Cancelled", value: 10, color: "#ef4444" }
  ];
  
  return (
    <div className={`${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30' 
        : 'bg-white border-gray-200'
    } border rounded-2xl p-5 shadow-sm transition-colors duration-300`}>
      <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold mb-3 text-sm`}>
        Order Status
      </h3>
      <div className="flex items-center justify-between">
        <div className="h-28 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 ml-4 space-y-2">
          {orderStatusData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.name}
                </span>
              </div>
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
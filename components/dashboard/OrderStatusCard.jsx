"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function OrderStatusCard() {
  
  const orderStatusData = [
    { name: "Completed", value: 65, color: "#10b981" },
    { name: "Pending", value: 25, color: "#f59e0b" },
    { name: "Cancelled", value: 10, color: "#ef4444" }
  ];
  
  return (
    <div className="border rounded-2xl p-5 shadow-sm transition-colors duration-300 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-blue-900/30">
      <h3 className="text-gray-900 dark:text-white font-semibold mb-3 text-sm">
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
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
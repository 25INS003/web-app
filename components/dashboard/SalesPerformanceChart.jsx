"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SalesPerformanceChart() {
  
  const salesData = [
    { month: "Jan", value: 6200 },
    { month: "Feb", value: 1800 },
    { month: "Mar", value: 5100 },
    { month: "Apr", value: 4600 },
    { month: "May", value: 8800 },
    { month: "Jun", value: 6200 },
    { month: "Jul", value: 5900 },
    { month: "Aug", value: 2800 },
    { month: "Sep", value: 7200 },
    { month: "Oct", value: 6900 },
    { month: "Nov", value: 7800 },
    { month: "Dec", value: 8400 }
  ];
  
  const totalRevenue = salesData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="border rounded-2xl p-4 shadow-sm transition-colors duration-300 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-blue-900/30">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Sales Performance
          </h2>
          <p className="text-gray-600 dark:text-gray-500 text-xs">
            Monthly sales trend for 2024
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600 dark:text-gray-500">
            Total Revenue
          </p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            ₹{totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#64748b" 
              opacity={0.3} 
            />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              style={{ fontSize: '11px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '11px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                color: '#000'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={2.5}
              dot={{ fill: '#3b82f6', r: 3 }}
              activeDot={{ r: 5 }}
              fill="url(#colorValue)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
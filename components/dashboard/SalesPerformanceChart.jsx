"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@/store/themeStore";

export default function SalesPerformanceChart() {
  const { isDark } = useTheme();
  
  // TODO: Replace with API call
  // Example: const { data: salesData } = useSWR('/api/dashboard/sales', fetcher);
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
    <div className={`${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30' 
        : 'bg-white border-gray-200'
    } border rounded-2xl p-4 shadow-sm transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Sales Performance
          </h2>
          <p className={`${isDark ? 'text-gray-500' : 'text-gray-600'} text-xs`}>
            Monthly sales trend for 2024
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Total Revenue
          </p>
          <p className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
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
              stroke={isDark ? "#1e293b" : "#e2e8f0"} 
              opacity={0.3} 
            />
            <XAxis 
              dataKey="month" 
              stroke={isDark ? "#475569" : "#94a3b8"}
              style={{ fontSize: '11px' }}
            />
            <YAxis 
              stroke={isDark ? "#475569" : "#94a3b8"}
              style={{ fontSize: '11px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                border: `1px solid ${isDark ? '#1e40af' : '#e2e8f0'}`,
                borderRadius: '12px',
                color: isDark ? '#fff' : '#000'
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
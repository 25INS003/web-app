"use client";

import { motion, LayoutGroup } from "framer-motion";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";

export default function SalesPerformanceChart() {
  const [activeTab, setActiveTab] = useState("month");
  
  const tabData = {
    week: [
      { name: "Mon", value: 1200 },
      { name: "Tue", value: 1800 },
      { name: "Wed", value: 1400 },
      { name: "Thu", value: 2200 },
      { name: "Fri", value: 1900 },
      { name: "Sat", value: 2800 },
      { name: "Sun", value: 2100 }
    ],
    month: [
      { name: "Jan", value: 6200 },
      { name: "Feb", value: 1800 },
      { name: "Mar", value: 5100 },
      { name: "Apr", value: 4600 },
      { name: "May", value: 8800 },
      { name: "Jun", value: 6200 },
      { name: "Jul", value: 5900 },
      { name: "Aug", value: 2800 },
      { name: "Sep", value: 7200 },
      { name: "Oct", value: 6900 },
      { name: "Nov", value: 7800 },
      { name: "Dec", value: 8400 }
    ],
    year: [
      { name: "2020", value: 45000 },
      { name: "2021", value: 52000 },
      { name: "2022", value: 68000 },
      { name: "2023", value: 71700 },
      { name: "2024", value: 85000 }
    ]
  };

  const tabs = [
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" }
  ];
  
  const salesData = tabData[activeTab];
  const totalRevenue = salesData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <motion.div 
      className="relative overflow-hidden border rounded-2xl p-5 shadow-sm transition-all duration-300 
                 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 
                 border-gray-200 dark:border-blue-900/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Sales Performance
              </h2>
              <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                <TrendingUp className="w-3 h-3" />
                +12.5%
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-500 text-xs flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {activeTab === "week" ? "This week's trend" : activeTab === "month" ? "Monthly trend for 2024" : "Yearly performance"}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Animated Tabs */}
            <LayoutGroup>
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                      activeTab === tab.id 
                        ? 'text-white' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="tab-pill"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/25"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
            
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-500">Total Revenue</p>
              <motion.p 
                key={totalRevenue}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-blue-600 dark:text-blue-400"
              >
                ₹{totalRevenue.toLocaleString()}
              </motion.p>
            </div>
          </div>
        </div>
        
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-48"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#64748b" 
                opacity={0.2} 
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                style={{ fontSize: '11px' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '11px' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                }}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#colorValue)"
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
}
"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CheckCircle, Clock, XCircle } from "lucide-react";

export default function OrderStatusCard() {
  const orderStatusData = [
    { name: "Completed", value: 65, color: "#10b981", icon: CheckCircle },
    { name: "Pending", value: 25, color: "#f59e0b", icon: Clock },
    { name: "Cancelled", value: 10, color: "#ef4444", icon: XCircle }
  ];

  const total = orderStatusData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <motion.div 
      className="relative overflow-hidden border rounded-2xl p-5 shadow-sm transition-all duration-300 
                 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 
                 border-gray-200 dark:border-blue-900/30 h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3 className="text-gray-900 dark:text-white font-semibold mb-4 text-base">
        Order Status
      </h3>
      
      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={48}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {orderStatusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="transparent"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{total}</p>
              <p className="text-[10px] text-gray-500">Orders</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-3">
          {orderStatusData.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div 
                key={idx} 
                className="group"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
                {/* Animated progress bar */}
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: idx * 0.15, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
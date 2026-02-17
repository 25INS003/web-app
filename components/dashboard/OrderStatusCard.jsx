"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle, Clock, XCircle, RotateCcw } from "lucide-react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl">
        <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">{data.name}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {data.count} Order{data.count !== 1 ? 's' : ''} ({data.value}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function OrderStatusCard({ data, loading }) {
  // data is stats.overview (contains ordersByStatus)
  const stats = data?.ordersByStatus || { completed: 0, pending: 0, cancelled: 0, refunded: 0 };
  const total = (stats.completed + stats.pending + stats.cancelled + stats.refunded) || 0;

  const orderStatusData = [
    { name: "Completed", value: total > 0 ? Math.round((stats.completed / total) * 100) : 0, count: stats.completed, color: "#10b981", icon: CheckCircle },
    { name: "Pending", value: total > 0 ? Math.round((stats.pending / total) * 100) : 0, count: stats.pending, color: "#f59e0b", icon: Clock },
    { name: "Cancelled", value: total > 0 ? Math.round((stats.cancelled / total) * 100) : 0, count: stats.cancelled, color: "#ef4444", icon: XCircle },
    { name: "Refunded", value: total > 0 ? Math.round((stats.refunded / total) * 100) : 0, count: stats.refunded, color: "#8b5cf6", icon: RotateCcw }
  ];

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
                nameKey="name"
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
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-2">
                      ({item.count})
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {item.value}%
                    </span>
                  </div>
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
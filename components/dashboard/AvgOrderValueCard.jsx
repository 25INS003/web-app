"use client";

import { motion } from "framer-motion";
import { ShoppingCart, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

function AnimatedCounter({ value, prefix = "", suffix = "", duration = 1500 }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    let animationFrame;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(easeOutQuart * value);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return `${prefix}${count.toFixed(2)}${suffix}`;
}

export default function AvgOrderValueCard() {
  const orderData = {
    avgValue: 156.80,
    percentage: 5.4,
    thisMonth: 164.20,
    lastMonth: 149.60
  };

  const isUp = orderData.thisMonth > orderData.lastMonth;
  
  return (
    <motion.div 
      className="relative overflow-hidden border rounded-2xl p-5 shadow-sm transition-all duration-300 
                 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 
                 border-gray-200 dark:border-blue-900/30 h-full group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Subtle gradient glow on hover */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/25"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <ShoppingCart className="w-5 h-5 text-white" />
          </motion.div>
          <motion.span 
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full ${
              isUp 
                ? 'text-green-600 bg-green-50 dark:bg-green-500/10' 
                : 'text-red-600 bg-red-50 dark:bg-red-500/10'
            }`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? '+' : ''}{orderData.percentage}%
          </motion.span>
        </div>
        
        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
          Avg Order Value
        </h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          <AnimatedCounter value={orderData.avgValue} prefix="₹" />
        </p>
        
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <motion.div 
            className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/10"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-0.5">This Month</p>
            <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
              ₹{orderData.thisMonth}
            </p>
          </motion.div>
          <motion.div 
            className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-0.5">Last Month</p>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
              ₹{orderData.lastMonth}
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
"use client";

import { motion } from "framer-motion";
import { BadgeIndianRupee, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

function AnimatedCounter({ value, duration = 1500 }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    let animationFrame;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return count.toLocaleString();
}

export default function TotalProfitCard() {
  const profitData = {
    total: 12304,
    percentage: 12.5,
    returnAmount: 1230
  };
  
  return (
    <motion.div 
      className="relative overflow-hidden border rounded-2xl p-5 shadow-sm transition-all duration-300 
                 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 
                 border-gray-200 dark:border-blue-900/30 group h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Subtle gradient glow on hover */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <BadgeIndianRupee className="w-6 h-6 text-white" />
          </motion.div>
          <motion.span 
            className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-500/10 px-2.5 py-1.5 rounded-full"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <TrendingUp className="w-3 h-3" />
            +{profitData.percentage}%
          </motion.span>
        </div>
        
        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
          Total Profit
        </h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          ₹<AnimatedCounter value={profitData.total} />
        </p>
        
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-500 text-xs">Return</span>
            <span className="text-sm font-semibold text-green-500">
              +₹{profitData.returnAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
"use client";

import { motion } from "framer-motion";
import { Users, UserPlus, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";

function AnimatedCounter({ value, duration = 1500 }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    let animationFrame;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
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

export default function TotalCustomersCard() {
  const customerData = {
    total: 8549,
    percentage: 23,
    newCustomers: 342,
    returningCustomers: 8207
  };
  
  return (
    <motion.div 
      className="relative overflow-hidden border rounded-2xl p-5 shadow-sm transition-all duration-300 
                 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 
                 border-gray-200 dark:border-blue-900/30 h-full group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Subtle gradient glow on hover */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/25"
            whileHover={{ scale: 1.05, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Users className="w-5 h-5 text-white" />
          </motion.div>
          <motion.span 
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            +{customerData.percentage}%
          </motion.span>
        </div>
        
        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">
          Total Customers
        </h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          <AnimatedCounter value={customerData.total} />
        </p>
        
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <motion.div 
            className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-500/10"
            whileHover={{ scale: 1.02 }}
          >
            <UserPlus className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-500">New</p>
              <p className="text-sm font-bold text-green-500">
                +{customerData.newCustomers}
              </p>
            </div>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10"
            whileHover={{ scale: 1.02 }}
          >
            <UserCheck className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-500">Returning</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {customerData.returningCustomers.toLocaleString()}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
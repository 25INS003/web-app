"use client";

import { motion } from "framer-motion";
import TotalProfitCard from "@/components/dashboard/TotalProfitCard";
import BestSellingProducts from "@/components/dashboard/BestSellingProducts";
import SalesPerformanceChart from "@/components/dashboard/SalesPerformanceChart";
import OrderStatusCard from "@/components/dashboard/OrderStatusCard";
import TotalCustomersCard from "@/components/dashboard/TotalCustomersCard";
import AvgOrderValueCard from "@/components/dashboard/AvgOrderValueCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15 
    }
  }
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* Dashboard Content */}
      <motion.div 
        className="p-4 md:p-6 transition-colors duration-300"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-gray-400 text-sm mt-1">
            Welcome to your sales overview
          </p>
        </motion.div>

        {/* Row 1: Profit + Top Products */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          <motion.div 
            variants={itemVariants} 
            className="col-span-12 md:col-span-4 lg:col-span-3"
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <TotalProfitCard />
          </motion.div>
          <motion.div 
            variants={itemVariants} 
            className="col-span-12 md:col-span-8 lg:col-span-9"
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <BestSellingProducts />
          </motion.div>
        </div>

        {/* Row 2: Sales Performance Chart */}
        <motion.div 
          variants={itemVariants} 
          className="mb-4"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <SalesPerformanceChart />
        </motion.div>

        {/* Row 3: Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <OrderStatusCard />
          </motion.div>
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <TotalCustomersCard />
          </motion.div>
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <AvgOrderValueCard />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
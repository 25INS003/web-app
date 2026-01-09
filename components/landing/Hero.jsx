"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoveRightIcon } from "@/components/ui/move-right-icon";
import CountUp from "@/components/ui/count-up";
import { useRef, useState } from "react";

export default function Hero() {
    const iconRef = useRef(null);
    const [activeOrderView, setActiveOrderView] = useState(1); // 0 = completed, 1 = pending

    return (
        <section id="hero" className="relative w-full min-h-screen pt-32 pb-20 px-6 lg:px-12 overflow-hidden bg-slate-50 dark:bg-slate-950">
            
            {/* Background Gradient Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center relative z-10">
                
                {/* Left Content */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                    className="max-w-2xl"
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-primary text-sm font-semibold">Admin Access Only</span>
                    </motion.div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.05] mb-8">
                        Nedyway{" "}
                        <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Portal
                        </span>
                        <br />
                        & Administration
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-lg">
                        The central command center for store owners and administrators. Manage products, inventory, orders, and analytics—all in one place.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                            asChild 
                            size="lg" 
                            className="rounded-full h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 transition-all hover:-translate-y-1 shadow-lg shadow-primary/25"
                            onMouseEnter={() => iconRef.current?.startAnimation()}
                            onMouseLeave={() => iconRef.current?.stopAnimation()}
                        >
                            <Link href="/dashboard" className="flex items-center">
                                Go to Dashboard <MoveRightIcon ref={iconRef} className="ml-2" size={26} />
                            </Link>
                        </Button>
                        <Button 
                            asChild 
                            variant="ghost" 
                            size="lg" 
                            className="rounded-full h-14 px-8 text-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                        >
                            <Link href="/login">Sign in / Switch Account</Link>
                        </Button>
                    </div>

                    {/* Trust Badges */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center gap-8 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800"
                    >
                        <div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                <CountUp from={0} to={500} duration={2} separator="," />
                                <span>+</span>
                            </div>
                            <div className="text-sm text-slate-500">Total Shops</div>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-slate-800" />
                        <div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                <CountUp from={0} to={4800} duration={2} separator="," />
                                <span>+</span>
                            </div>
                            <div className="text-sm text-slate-500">Total Products</div>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-slate-800" />
                        <div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                <CountUp from={0} to={99.9} duration={2} />
                                <span>%</span>
                            </div>
                            <div className="text-sm text-slate-500">Uptime</div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right Content - Dashboard Mockup */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="relative hidden lg:block"
                >
                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-2 gap-5 w-full max-w-xl">
                        
                        {/* Card 1: Products Managed (Top Left) */}
                        <motion.div 
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 relative group"
                        >
                            {/* Star badge */}
                            <motion.div 
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-3 -right-3 text-yellow-400 text-3xl drop-shadow-lg"
                            >
                                ★
                            </motion.div>
                            
                            <div className="text-sm text-slate-400 mb-2">Products Managed</div>
                            <div className="flex items-end gap-3 mb-5">
                                <span className="text-4xl font-bold text-white">4.8k</span>
                                <span className="text-sm font-bold text-green-400 mb-1 bg-green-400/10 px-2 py-0.5 rounded-full">+320</span>
                            </div>
                            {/* Mini Bar Chart */}
                            <div className="flex items-end gap-2 h-14">
                                {[40, 65, 50, 85, 60, 95, 75].map((height, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
                                        className={`flex-1 rounded-md ${i === 5 ? 'bg-primary' : i === 6 ? 'bg-purple-500' : 'bg-slate-700'}`}
                                    />
                                ))}
                            </div>
                        </motion.div>

                        {/* Card 2: Total Orders (Top Right) */}
                        <motion.div 
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-white mb-2">
                                        {activeOrderView === 0 ? "Completed" : "Total Orders"}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setActiveOrderView(0)}
                                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                                                activeOrderView === 0 
                                                    ? 'bg-primary scale-125' 
                                                    : 'bg-slate-600 hover:bg-slate-500'
                                            }`}
                                        />
                                        <button 
                                            onClick={() => setActiveOrderView(1)}
                                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                                                activeOrderView === 1 
                                                    ? 'bg-primary scale-125' 
                                                    : 'bg-slate-600 hover:bg-slate-500'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Donut Chart */}
                            <div className="relative w-24 h-24 mx-auto mb-3">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-800" />
                                    <motion.circle 
                                        cx="50" cy="50" r="40" fill="none" strokeWidth="10" 
                                        className="text-primary"
                                        strokeDasharray="251.2"
                                        initial={{ strokeDashoffset: 251.2 }}
                                        animate={{ strokeDashoffset: activeOrderView === 0 ? 251.2 * 0.25 : 251.2 * 0.4 }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.span 
                                        key={activeOrderView}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-xl font-bold text-white"
                                    >
                                        {activeOrderView === 0 ? "1.1k" : "1.5k"}
                                    </motion.span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 text-center">
                                {activeOrderView === 0 ? "Completed this month" : "Monthly orders"}
                            </p>
                        </motion.div>

                        {/* Card 3: Monthly Performance (Bottom - Full Width) */}
                        <motion.div 
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className="col-span-2 bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-base font-semibold text-white">Monthly Performance</div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        Revenue
                                    </span>
                                </div>
                            </div>
                            <div className="w-full h-24 relative">
                                <svg viewBox="0 0 400 70" className="w-full h-full" preserveAspectRatio="none">
                                    {/* Grid Lines */}
                                    {[17, 35, 52].map((y) => (
                                        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="currentColor" strokeWidth="0.5" className="text-slate-800" />
                                    ))}
                                    {/* Gradient Fill */}
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Area Fill */}
                                    <motion.path 
                                        d="M0 45 C 60 55, 80 30, 130 35 S 200 50, 250 40 S 320 18, 400 28 L 400 70 L 0 70 Z"
                                        fill="url(#chartGradient)"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.2 }}
                                    />
                                    {/* Line */}
                                    <motion.path 
                                        d="M0 45 C 60 55, 80 30, 130 35 S 200 50, 250 40 S 320 18, 400 28"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        className="text-primary"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                                    />
                                </svg>
                            </div>
                        </motion.div>

                    </div>
                </motion.div>
            </div>
        </section>
    );
}

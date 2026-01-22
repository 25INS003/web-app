"use client";

import { motion } from "framer-motion";
import { Bell, Search, Plus, Store, Package, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/theme-toggle";
import ProfileDropdown from "@/components/profile-dropdown";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function AdminHeader() {
    const router = useRouter();
    const [searchFocused, setSearchFocused] = useState(false);

    return (
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-full w-full flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6"
        >
            {/* Search Bar */}
            <motion.div 
                animate={{ 
                    scale: searchFocused ? 1.02 : 1,
                    boxShadow: searchFocused ? "0 4px 20px rgba(59, 130, 246, 0.15)" : "0 0 0 rgba(0,0,0,0)"
                }}
                className={`flex items-center rounded-xl px-4 py-2.5 w-96 transition-all duration-300 ${
                    searchFocused 
                        ? 'bg-white dark:bg-slate-800 border-2 border-blue-500' 
                        : 'bg-slate-100 dark:bg-slate-800 border-2 border-transparent'
                }`}
            >
                <Search className={`transition-colors ${searchFocused ? 'text-blue-500' : 'text-slate-400'}`} size={18} />
                <input
                    type="text"
                    placeholder="Search orders, products, or customers..."
                    className="ml-3 w-full bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                />
            </motion.div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                {/* Quick Add Dropdown */}
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 border-0">
                                <Plus size={16} />
                                <span>Quick Add</span>
                            </Button>
                        </motion.div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
                        <DropdownMenuItem 
                            onClick={() => router.push('/myshop/add')}
                            className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            <Store className="mr-2 h-4 w-4 text-blue-500" />
                            Add New Shop
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => router.push('/products')}
                            className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            <Package className="mr-2 h-4 w-4 text-purple-500" />
                            Add Product
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications */}
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative rounded-xl p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <Bell size={18} className="text-slate-600 dark:text-slate-300" />
                    <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"
                    />
                </motion.button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User menu */}
                <ProfileDropdown />
            </div>
        </motion.div>
    );
}
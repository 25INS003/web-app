"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Moon, Sun, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import AdminProfileDropdown from "@/components/admin-profile-dropdown";

export default function AdminNavbar() {
    const { theme, setTheme } = useTheme();
    const pathname = usePathname();

    // Generate page title from pathname
    const getPageTitle = () => {
        const segments = pathname.split('/').filter(Boolean); // Remove empty strings
        if (segments.length <= 1) return "Dashboard"; // /admin
        
        const lastSegment = segments[segments.length - 1];
        return lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-16 w-full flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 sticky top-0 z-30 transition-all"
        >
            {/* Left: Title (replacing Search Bar placeholder) */}
            <div className="flex flex-1 items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {getPageTitle()}
                </h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Notifications */}
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative rounded-xl p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <Bell size={18} className="text-slate-600 dark:text-slate-300" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                </motion.button>
                
                {/* Theme Toggle (Inline implementation to match Shop's ThemeToggle feel if not component) */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="relative rounded-xl p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors overflow-hidden"
                >
                    <Sun size={18} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                    <Moon size={18} className="absolute top-2.5 left-2.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-500" />
                </motion.button>

                {/* Profile Dropdown */}
                <AdminProfileDropdown />
            </div>
        </motion.div>
    );
}

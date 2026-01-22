// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSidebar } from "@/store/uiStore";
import { usePathname } from "next/navigation";
import { useRef } from "react";

// Import animated icons
import { DashboardIcon } from "@/components/ui/animated-icons";
import { StoreIcon } from "@/components/ui/customer-icons";
import { PackageIcon, ShoppingBagIcon, LayersIcon, ShieldIcon, LogOutIcon } from "@/components/ui/sidebar-icons";

const Sidebar = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    // Refs for each animated icon
    const iconRefs = {
        dashboard: useRef(null),
        myshop: useRef(null),
        products: useRef(null),
        orders: useRef(null),
        categories: useRef(null),
        verify: useRef(null),
        logout: useRef(null),
    };

    const menuItems = [
        { name: "Dashboard", icon: DashboardIcon, href: "/dashboard", refKey: "dashboard" },
        { name: "My Shops", icon: StoreIcon, href: "/myshop", refKey: "myshop" },
        { name: "Products", icon: PackageIcon, href: "/products", refKey: "products" },
        { name: "Orders", icon: ShoppingBagIcon, href: "/orders", refKey: "orders" },
        { name: "Categories", icon: LayersIcon, href: "/categories", refKey: "categories" },
        ...(user?.user_type === "admin"
            ? [{ name: "Verify", icon: ShieldIcon, href: "/verify-owner", refKey: "verify" }]
            : []),
    ];

    const handleItemClick = (refKey) => {
        const ref = iconRefs[refKey];
        if (ref?.current?.startAnimation) {
            ref.current.startAnimation();
        }
    };

    return (
        <aside
            className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ease-out ${
                isSidebarOpen ? 'w-64' : 'w-20'
            }`}
        >
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 opacity-50" />
            
            <div className="relative z-10 flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
                    {isSidebarOpen && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <span className="text-white font-bold text-sm">N</span>
                            </div>
                            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Nedyway
                            </span>
                        </motion.div>
                    )}
                    
                    <button 
                        onClick={toggleSidebar} 
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft 
                            size={18} 
                            className={`text-slate-600 dark:text-slate-400 transition-transform duration-200 ${
                                isSidebarOpen ? '' : 'rotate-180'
                            }`} 
                        />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href === "/myshop" && pathname.startsWith("/myshop")) ||
                            (item.href === "/products" && pathname.startsWith("/products")) ||
                            (item.href === "/verify" && pathname.startsWith("/verify")) ||
                            (item.href === "/categories" && pathname.startsWith("/categories"));
                        
                        const IconComponent = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => handleItemClick(item.refKey)}
                                className={`relative flex items-center rounded-xl p-3 mb-1 transition-all duration-200 group
                                    ${isSidebarOpen ? "gap-3 justify-start" : "justify-center"}
                                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-3">
                                    <IconComponent
                                        ref={iconRefs[item.refKey]}
                                        size={20}
                                        isAnimated={false}
                                        className={`transition-colors duration-200 ${
                                            isActive 
                                                ? "text-white" 
                                                : "text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                        }`}
                                    />
                                    
                                    {isSidebarOpen && (
                                        <motion.span 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`whitespace-nowrap text-sm font-medium transition-colors duration-200 ${
                                                isActive 
                                                    ? "text-white" 
                                                    : "text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                                            }`}
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => {
                            handleItemClick("logout");
                            logout();
                        }}
                        className={`w-full flex items-center rounded-xl p-3 transition-all duration-200
                            bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500
                            ${isSidebarOpen ? "gap-3 justify-start" : "justify-center"}
                        `}
                    >
                        <LogOutIcon ref={iconRefs.logout} size={20} isAnimated={false} />
                        {isSidebarOpen && (
                            <span className="text-sm font-medium">Logout</span>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
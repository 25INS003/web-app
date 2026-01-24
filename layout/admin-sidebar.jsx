"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSidebar } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { 
    LayoutDashboard, 
    Store, 
    Users, 
    Layers, 
    FileText, 
    LogOut,
    ChevronLeft,
    Shield
} from "lucide-react";

const AdminSidebar = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuthStore();

    const handleLogout = async () => {
        await logout("/admin/login");
    };

    // Mapping Lucide icons to look consistent
    const menuItems = [
        { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
        { name: "Shops", icon: Store, href: "/admin/shops" },
        { name: "Shop Owners", icon: Users, href: "/admin/shop-owners" },
        { name: "Categories", icon: Layers, href: "/admin/categories" },
        { name: "Reports", icon: FileText, href: "/admin/reports" },
    ];

    return (
        <aside
            className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ease-out ${
                isSidebarOpen ? 'w-64' : 'w-20'
            }`}
        >
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 opacity-50" />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
                    {isSidebarOpen && (
                         <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2"
                        >
                            <div className="p-1.5 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/25">
                                <Shield size={18} className="text-white" />
                            </div>
                            <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                AdminPanel
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

                {/* Navigation */}
                <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                        
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`relative flex items-center rounded-xl p-3 mb-1 transition-all duration-200 group
                                    ${isSidebarOpen ? "gap-3 justify-start" : "justify-center"}
                                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill-admin"
                                        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-3">
                                    <item.icon 
                                        size={20} 
                                        className={`transition-colors duration-200 ${
                                            isActive 
                                                ? "text-white" 
                                                : "text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
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

                {/* Footer */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center rounded-xl p-3 transition-all duration-200
                            bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500
                            ${isSidebarOpen ? "gap-3 justify-start" : "justify-center"}
                        `}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;

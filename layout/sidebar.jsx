// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Users, Settings, Package, ChevronLeft, Menu, Store } from "lucide-react";
import { useSidebar } from "@/store/uiStore";
import { usePathname } from "next/navigation";

const Sidebar = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const pathname = usePathname();

    const menuItems = [
        { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { name: "Orders", icon: ShoppingBag, href: "/orders" },
        { name: "Products", icon: Package, href: "/products" },
        { name: "My Shops", icon: Store, href: "/myshop" },
        { name: "Settings", icon: Settings, href: "/settings" },
    ];

    return (
        <aside
            className={`fixed left-0 top-0 z-40 h-screen bg-slate-900 dark:bg-slate-800 text-white transition-all duration-300 border-r ${isSidebarOpen ? "w-64" : "w-20"
                }`}
        >
            {/* Sidebar Header */}
            <div className={`flex h-16 items-center justify-between px-4 border-b
                ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
                <h1 className={`font-bold text-xl ${!isSidebarOpen && "hidden"}`}>MyShop</h1>
                <button onClick={toggleSidebar} className="p-1 rounded hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                    {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="mt-4 flex flex-col gap-2 px-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href === "/myshop" && pathname.startsWith("/myshop"));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center rounded-md p-3 transition-colors group
                                    ${isActive 
                                        ? "bg-blue-600 text-white" 
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700 dark:hover:text-white"
                                    }
                                    ${isSidebarOpen 
                                        ? "p-3 gap-4 justify-start"        
                                        : "p-3 gap-0 justify-center"       
                                    }
                                `}
                        >
                            <item.icon size={22} />
                            {isSidebarOpen &&
                                <span className={`whitespace-nowrap overflow-hidden text-ellipsis`}>
                                    {item.name}
                                </span>
                            }
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Users, Settings, Package, ChevronLeft, Menu } from "lucide-react";
import { useSidebar } from "@/store/uiStore";


const Sidebar = () => {
    const { isSidebarOpen, toggleSidebar } = useSidebar();

    const menuItems = [
        { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
        { name: "Orders", icon: ShoppingBag, href: "/admin/orders" },
        { name: "Products", icon: Package, href: "/admin/products" },
        { name: "Customers", icon: Users, href: "/admin/customers" },
        { name: "Settings", icon: Settings, href: "/admin/settings" },
    ];

    return (
        <aside
            className={`fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"
                }`}
        >
            {/* Sidebar Header */}
            <div className="flex h-16 items-center justify-between px-4">
                <h1 className={`font-bold text-xl ${!isSidebarOpen && "hidden"}`}>MyShop</h1>
                <button onClick={toggleSidebar} className="p-1 rounded hover:bg-slate-800">
                    {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="mt-4 flex flex-col gap-2 px-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-4 rounded-md p-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <item.icon size={22} />
                        <span className={`whitespace-nowrap ${!isSidebarOpen && "hidden"}`}>
                            {item.name}
                        </span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
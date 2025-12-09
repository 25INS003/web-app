"use client";

import Sidebar from "@/layout/sidebar";
import Header from "@/layout/header";
import { useSidebar } from "@/store/uiStore";
import { usePathname } from "next/navigation";

export default function AdminLayout({children}) {
    const { isSidebarOpen } = useSidebar();
    const pathname = usePathname();
    const isDashboard = pathname === "/dashboard" || pathname === "/";

    return (
        <div className="min-h-screen bg-black">
            {/* 1. Sidebar */}
            <Sidebar />

            {/* 2. Header */}
            <Header />

            {/* 3. Main Content Area */}
            <main
                className={`transition-all duration-300 ${
                    isDashboard 
                        ? `pt-16 ${isSidebarOpen ? "ml-64" : "ml-20"}` 
                        : `pt-20 px-6 pb-8 bg-slate-50 ${isSidebarOpen ? "ml-64" : "ml-20"}`
                }`}
            >
                {children}
            </main>
        </div>
    );
}
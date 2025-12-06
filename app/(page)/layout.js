// src/app/(page)/layout.tsx
"use client";

import Sidebar from "@/layout/sidebar";
import Header from "@/layout/header";
import { useSidebar } from "@/store/uiStore";

export default function AdminLayout({children}) {
    const { isSidebarOpen } = useSidebar();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* 1. Sidebar */}
            <Sidebar />

            {/* 2. Header */}
            <Header />

            {/* 3. Main Content Area */}
            <main
                className={`pt-20 px-6 pb-8 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"
                    }`}
            >
                {children}
            </main>
        </div>
    );
}
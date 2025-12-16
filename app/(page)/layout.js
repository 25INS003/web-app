// src/app/(page)/layout.tsx
"use client";

import Sidebar from "@/layout/sidebar";
import Header from "@/layout/header";
import { useSidebar } from "@/store/uiStore";
import { cn } from "@/lib/utils";

// import { useEffect } from "react";
// import { useAuthStore } from "@/store/authStore";
// import Cookies from 'js-cookie';

export default function AdminLayout({ children }) {
    const { isSidebarOpen } = useSidebar();

    // !! Only enable this if you want strict syncing !!
    ///////////////////////////////////////////////////////////////////////////
    // const { logout } = useAuthStore();                                   //
    // useEffect(() => {                                                    //
    //     // If cookie is gone but state says logged in, force logout     //
    //     const token = Cookies.get('accessToken');                       //
    //     if (!token) {
    //         logout(); 
    //     }
    // }, []);
    ////////////////////////////////////////////////////

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Sidebar */}
            <Sidebar />

            {/* Header */}
            <Header />

            {/* Main Content */}
            <main
                className={cn(
                    "flex flex-col", 
                    "pt-20 px-6 pb-8",
                    "min-h-[calc(100vh-5rem)]",
                    "transition-[margin] duration-300",
                    isSidebarOpen ? "ml-64" : "ml-20"
                )}
            >
                {children}
            </main>
        </div>
    );

}
// src/app/(page)/layout.tsx
"use client";

import Sidebar from "@/layout/sidebar";
import Header from "@/layout/header";
import { useSidebar } from "@/store/uiStore";

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
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
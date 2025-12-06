// src/components/Header.tsx
"use client";

import AdminHeader from "@/components/navbar/AdminHeader";
import { useSidebar } from "@/store/uiStore";


const Header = () => {
    const { isSidebarOpen } = useSidebar();

    return (
        <header
            className={`fixed top-0 right-0 h-16 z-30  transition-all duration-300 ${isSidebarOpen ? "left-64" : "left-20"
                }`}
        >
            <AdminHeader />
        </header>
    );
};

export default Header;
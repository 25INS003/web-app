"use client";

import AdminSidebar from "@/layout/admin-sidebar";
import AdminNavbar from "@/layout/admin-navbar";
import AdminGuard from "@/components/guards/AdminGuard";
import { useSidebar } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
    const { isSidebarOpen } = useSidebar();
    const pathname = usePathname();

    // Exclude Login page from Admin Guard and Layout
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    return (
        <AdminGuard>
            <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
                {/* Admin Sidebar */}
                <AdminSidebar />

                {/* Main Content Area */}
                <main
                    className={cn(
                        "flex flex-col min-h-screen transition-[margin] duration-300",
                        isSidebarOpen ? "ml-64" : "ml-20"
                    )}
                >
                    <AdminNavbar />
                    <div className="p-6 md:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}

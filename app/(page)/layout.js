// src/app/(page)/layout.tsx
"use client";

import Sidebar from "@/layout/sidebar";
import Header from "@/layout/header";
import { useSidebar } from "@/store/uiStore";
import { cn } from "@/lib/utils";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { ShieldIcon } from "@/components/ui/sidebar-icons";

export default function AdminLayout({ children }) {
    const { isSidebarOpen } = useSidebar();
    const { user, approvalStatus } = useAuthStore();

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
                {/* Status Guard for Shop Owners */}
                {user?.user_type === 'shop_owner' && approvalStatus && approvalStatus !== 'approved' ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center space-y-6">
                        {approvalStatus === 'revoked' && (
                            <>
                                <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full animate-bounce">
                                    <ShieldIcon size={48} className="text-amber-600 dark:text-amber-500" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Application Revoked</h2>
                                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                                    Your application has been revoked by the administrator. 
                                    Please update your details to be reconsidered.
                                </p>
                                <a href="/onboarding" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/25">
                                    Update Details
                                </a>
                            </>
                        )}
                        {approvalStatus === 'rejected' && (
                            <>
                                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                                    <ShieldIcon size={48} className="text-red-600 dark:text-red-500" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Application Rejected</h2>
                                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                                    Your application was rejected. Please review the requirements and submit a fresh application.
                                </p>
                                <a href="/onboarding" className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg hover:shadow-red-500/25">
                                    Resubmit Application
                                </a>
                            </>
                        )}
                        {(approvalStatus === 'pending' || approvalStatus === 'draft') && (
                            <>
                                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-pulse">
                                    <ShieldIcon size={48} className="text-blue-600 dark:text-blue-500" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Verification Pending</h2>
                                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                                    Your application is currently under review by our team. 
                                    You will be notified once a decision is made.
                                </p>
                                <button className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold cursor-not-allowed">
                                    Awaiting Approval
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    children
                )}
            </main>
        </div>
    );

}
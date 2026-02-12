"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export default function AdminGuard({ children }) {
    const { user, isAuthenticated, loading } = useAuthStore();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // If auth loading is done, check permissions
        if (!loading) {
            if (!isAuthenticated) {
                router.replace("/admin/login");
            } else if (user?.user_type !== "admin") {
                router.replace("/dashboard");
            } else {
                setIsChecking(false);
            }
        }
    }, [isAuthenticated, user, loading, router]);

    if (loading || isChecking) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-slate-500">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    return children;
}

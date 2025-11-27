// hooks/useLogout.js
"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export const useLogout = () => {
    const router = useRouter();
    const { logout, loading } = useAuthStore();

    const handleLogout = async (redirectPath = "/login") => {
        try {
            await logout();
            router.push(redirectPath);
            router.refresh();
            return { success: true };
        } catch (error) {
            console.error("Logout failed:", error);
            router.push(redirectPath);
            return { success: false, error: "Logout failed" };
        }
    };

    return {
        logout: handleLogout,
        loading,
    };
};
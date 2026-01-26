// hooks/useLogout.js
"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export const useLogout = () => {
    const router = useRouter();
    const { logout, loading } = useAuthStore();

    const handleLogout = async (redirectPath = "/login") => {
        try {
            // Pass redirectPath to store so it redirects to the correct place
            await logout(redirectPath);
            // router.push(redirectPath); // Store handles redirection via window.location.replace
            // router.refresh();
            return { success: true };
        } catch (error) {
            console.error("Logout failed:", error);
            // Fallback if store fails (though store also catches errors)
             window.location.replace(redirectPath); 
            return { success: false, error: "Logout failed" };
        }
    };

    return {
        logout: handleLogout,
        loading,
    };
};
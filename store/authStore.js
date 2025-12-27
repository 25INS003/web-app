// store/authStore.js
"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";
import { persist, createJSONStorage } from "zustand/middleware";
import Routes from "@/api/endpoints";
import Cookies from "js-cookie";

export const useAuthStore = create(
    persist(
        (set, get) => ({

            // STATE
            email: "",
            user: null,
            accessToken: null,
            refreshToken: null,
            resetToken: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            message: null, // For success messages (e.g., "OTP Sent")

            // ACTIONS
            setEmail: (email) => set({ email }),
            clearError: () => set({ error: null, message: null }),

            // ------------------------
            // REGISTER
            // ------------------------
            register: async (userData) => {
                set({ loading: true, error: null });
                try {
                    const res = await apiClient.post(Routes.AUTH.REGISTER, userData);

                    // Backend returns { user, user_type, customer_profile (optional) }
                    // We don't auto-login on register usually, but we stop loading.
                    set({ loading: false });

                    return { success: true, message: "Registration successful" };
                } catch (err) {
                    const errorMessage = err.response?.data?.message || err.message;
                    set({ error: errorMessage, loading: false });
                    return { success: false, error: errorMessage };
                }
            },

            // ------------------------
            // LOGIN
            // ------------------------
            login: async (credentials) => {
                set({ loading: true, error: null });

                try {
                    const res = await apiClient.post(Routes.AUTH.LOGIN, credentials);

                    const { user, accessToken, refreshToken } = res.data.data;

                    // Set client-side cookies for Middleware/UI convenience
                    // Note: Security-critical cookies (httpOnly) are set by the backend automatically
                    Cookies.set("userRole", user.user_type, { expires: 1 });
                    Cookies.set("accessToken", accessToken, { expires: 1 });

                    set({
                        user,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                        loading: false,
                        error: null,
                    });

                    return { success: true, user };
                } catch (err) {
                    const errorMessage = err.response?.data?.message || err.message;
                    set({ error: errorMessage, loading: false });
                    return { success: false, error: errorMessage };
                }
            },

            // ------------------------
            // LOGOUT
            // ------------------------
            logout: async () => {
                try {
                    // Remove client-side cookies
                    Cookies.remove("accessToken");
                    Cookies.remove("userRole");
                    Cookies.remove("sessionId");
                    Cookies.remove("next-auth.session-token");

                    // Reset State
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        error: null,
                        message: null
                    });
                    setTimeout(() => {
                        window.location.replace("/login");
                    }, 100);

                    // Call Backend to clear httpOnly cookies and session
                    await apiClient.post(Routes.AUTH.LOGOUT, {}, { withCredentials: true });

                } catch (error) {
                    setTimeout(() => {
                        window.location.replace("/login");
                    }, 100);
                    console.error("Logout error:", error);

                }
            },

            // ------------------------
            // REFRESH TOKENS
            // ------------------------
            refreshTokens: async () => {
                try {
                    // Backend expects refreshToken in cookie (preferred) or body
                    const res = await apiClient.post(
                        Routes.AUTH.REFRESH,
                        {},
                        { withCredentials: true }
                    );

                    const { accessToken, refreshToken } = res.data.data;

                    set({ accessToken, refreshToken });
                    Cookies.set("accessToken", accessToken, { expires: 1 });

                    return { success: true };
                } catch (error) {
                    // If refresh fails, session is dead. Force logout.
                    get().logout();
                    return { success: false, error: "Session expired" };
                }
            },

            // ------------------------
            // INITIALIZE (Auto-login / Hydrate)
            // ------------------------
            initializeAuth: async () => {
                const token = get().accessToken || Cookies.get("accessToken");

                if (!token) {
                    return { success: false };
                }

                try {
                    const res = await apiClient.get(Routes.AUTH.PROFILE, {
                        withCredentials: true,
                    });

                    // Backend returns: { user, customer_profile }
                    const { user } = res.data.data;

                    set({
                        user,
                        isAuthenticated: true,
                    });

                    return { success: true };
                } catch (error) {
                    // Token likely expired, try one refresh attempt
                    const refreshResult = await get().refreshTokens();
                    if (refreshResult.success) {
                        return get().initializeAuth(); // Retry profile fetch
                    } else {
                        get().logout(); // Fail completely
                        return { success: false };
                    }
                }
            },

            // ------------------------
            // GET PROFILE (Manual Fetch)
            // ------------------------
            getProfile: async () => {
                set({ loading: true, error: null });
                try {
                    const res = await apiClient.get(Routes.AUTH.PROFILE, {
                        withCredentials: true,
                    });

                    const { user } = res.data.data;

                    set({
                        user,
                        loading: false
                    });

                    return { success: true, user };
                } catch (err) {
                    set({ error: "Failed to fetch profile", loading: false });
                    return { success: false };
                }
            },

            // ------------------------
            // FORGOT PASSWORD
            // ------------------------
            forgotPassword: async (email) => {
                set({ loading: true, error: null });

                try {
                    await apiClient.post(Routes.AUTH.FORGOT, { email });
                    set({ loading: false });
                    return { success: true };
                } catch (err) {
                    const errorMessage = err.response?.data?.message || err.message;
                    set({ error: errorMessage, loading: false });
                    return { success: false, error: errorMessage };
                }
            },

            // ------------------------
            // RESET PASSWORD
            // ------------------------
            resetPassword: async (token, newPassword) => {
                set({ loading: true, error: null });

                try {
                    await apiClient.post(Routes.AUTH.RESET, {
                        token,
                        newPassword,
                    });
                    set({ loading: false });
                    return { success: true };
                } catch (err) {
                    const errorMessage = err.response?.data?.message || err.message;
                    set({ error: errorMessage, loading: false });
                    return { success: false, error: errorMessage };
                }
            },

            // ------------------------
            // USER UPDATE (Local State Helper)
            // ------------------------
            updateUser: (userData) => {
                set((state) => ({
                    user: { ...state.user, ...userData },
                }));
            },

            // ============================================================
            // PASSWORD RESET FLOW (OTP BASED)
            // ============================================================

            // Step 1: Request OTP
            sendOtp: async (email) => {
                set({ loading: true, error: null, message: null });
                try {
                    // Check your Routes file to ensure this path is correct
                    const res = await apiClient.post(Routes.AUTH.PASSWORD?.FORGOT || "/auth/password/forgot", { email });
                    set({ loading: false, message: res.data.message, email }); // Save email for next steps
                    return { success: true };
                } catch (err) {
                    set({ error: err.response?.data?.message || "Error sending OTP", loading: false });
                    return { success: false };
                }
            },

            // Step 2: Resend OTP
            resendOtp: async (email) => {
                set({ loading: true, error: null, message: null });
                try {
                    const res = await apiClient.post(Routes.AUTH.PASSWORD?.RESEND_OTP || "/auth/password/resend-otp", { email });
                    set({ loading: false, message: res.data.message });
                    return { success: true };
                } catch (err) {
                    set({ error: err.response?.data?.message || "Error resending OTP", loading: false });
                    return { success: false };
                }
            },

            // Step 3: Verify OTP
            verifyOtp: async (email, otp) => {
                set({ loading: true, error: null });
                try {
                    const res = await apiClient.post(Routes.AUTH.PASSWORD?.VERIFY_OTP || "/auth/password/verify-otp", { email, otp });

                    // Backend should return a temporary resetToken here
                    const { resetToken } = res.data.data;

                    set({
                        resetToken: resetToken,
                        loading: false,
                        error: null
                    });
                    return { success: true };
                } catch (err) {
                    set({ error: err.response?.data?.message || "Invalid OTP", loading: false });
                    return { success: false };
                }
            },

            // Step 4: Final Reset
            resetPassword: async (newPassword) => {
                // Use get() to access current state inside the store
                const { resetToken } = get();

                if (!resetToken) {
                    set({ error: "Session expired. Please start over." });
                    return { success: false };
                }

                set({ loading: true, error: null });
                try {
                    await apiClient.post(Routes.AUTH.PASSWORD?.RESET || "/auth/password/reset", {
                        resetToken,
                        newPassword
                    });

                    // Clear sensitive state on success
                    set({ loading: false, resetToken: null, email: "", message: "Password reset successfully" });
                    return { success: true };
                } catch (err) {
                    set({ error: err.response?.data?.message || "Reset failed", loading: false });
                    return { success: false };
                }
            },

        }),
        {
            name: "ins03-auth-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                user: state.user,
            }),
        }
    )
);
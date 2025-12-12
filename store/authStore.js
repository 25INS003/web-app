// store/authStore.js
"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";
import { persist, createJSONStorage } from "zustand/middleware";
import Routes from "@/api/endpoints";
import Cookies from "js-cookie";

export const useAuthStore = create(
    persist((set, get) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        error: null,


        // ------------------------
        // LOGIN
        // ------------------------
        login: async (credentials) => {
            set({ loading: true, error: null });
            console.log(credentials);

            try {
                const res = await apiClient.post(Routes.AUTH.LOGIN, credentials, {
                    withCredentials: true,
                });
                console.log("Login response:", res);

                const { user, accessToken, refreshToken } = res.data.data;

                // SET COOKIE FOR MIDDLEWARE (Expires in 1 day, adjust as needed)
                Cookies.set("accessToken", accessToken, { expires: 1 });
                Cookies.set("userRole", user.user_type, { expires: 1 });

                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    loading: false,
                });

                return { success: true, user };
            } catch (err) {
                console.log(err);
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
                await apiClient.post(Routes.AUTH.LOGOUT, {}, { withCredentials: true });
            } catch { }

            // REMOVE COOKIE
            Cookies.remove("accessToken");
            Cookies.remove("userRole");
            Cookies.remove("next-auth.session-token");
            set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
            });
        },

        // ------------------------
        // REFRESH TOKENS
        // ------------------------
        refreshTokens: async () => {
            try {
                const res = await apiClient.post(
                    Routes.AUTH.REFRESH,
                    {},
                    { withCredentials: true }
                );

                const { accessToken, refreshToken } = res.data.data;

                set({ accessToken, refreshToken });

                return { success: true };
            } catch {
                get().logout();
                return { success: false, error: "Session expired" };
            }
        },

        // ------------------------
        // INITIALIZE (Auto-login)
        // ------------------------
        initializeAuth: async () => {
            try {
                const res = await apiClient.get(Routes.AUTH.PROFILE, {
                    withCredentials: true,
                });

                set({
                    user: res.data.data,
                    isAuthenticated: true,
                });

                return { success: true };
            } catch {
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });

                return { success: false };
            }
        },

        // ------------------------
        // GET PROFILE
        // ------------------------
        getProfile: async () => {
            if (user.user_type === "shop_owner") {

            }

            set({ loading: true, error: null });
            try {
                const res = await apiClient.get(Routes.AUTH.PROFILE, {
                    withCredentials: true,
                });

                set({ user: res.data.data });

                return { success: true, user: res.data.data };
            } catch {
                set({ error: "Failed to fetch profile" });
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
        // USER UPDATE
        // ------------------------
        updateUser: (userData) => {
            set((state) => ({
                user: { ...state.user, ...userData },
            }));
        },

        // ------------------------
        // CLEAR ERROR
        // ------------------------
        clearError: () => set({ error: null }),
    }),
        {
            name: "ins03-auth-storage", // Name of the item in localStorage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) default is localStorage
            // You might want to omit 'user', 'loading', 'error' from persistence
            // as they should be fetched/calculated on load.
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                user: state.user,
            }),

        }
    )
);

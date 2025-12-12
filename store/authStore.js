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
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            loading: false,
            error: null,

            // ------------------------
            // REGISTER
            // ------------------------
            register: async (userData) => {
                set({ loading: true, error: null });
                try {
                    // Assuming Routes.AUTH.REGISTER maps to your register endpoint
                    const res = await apiClient.post(Routes.AUTH.REGISTER, userData);
                    
                    // Backend returns { user, user_type } but no tokens on register
                    // User needs to login after registration
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
                    
                    // Matches ApiResponse structure: { user, accessToken, refreshToken }
                    const { user, accessToken, refreshToken } = res.data.data;

                    // NOTE: Backend sets httpOnly cookies for security. 
                    // We set these client-side cookies primarily for Middleware checks 
                    // or easy access to user roles in the UI.
                    Cookies.set("userRole", user.user_type, { expires: 1 });
                    Cookies.set("accessToken", accessToken, { expires: 1 }); 

                    set({
                        user,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                        loading: false,
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
                    // Call backend to clear httpOnly cookies
                    await apiClient.post(Routes.AUTH.LOGOUT, {}, { withCredentials: true });
                } catch (error) {
                    console.error("Logout error:", error);
                }

                // Remove client-side cookies
                Cookies.remove("accessToken");
                Cookies.remove("userRole");
                Cookies.remove("next-auth.session-token"); // If applicable

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
                    // Backend expects refreshToken in cookie or body
                    const res = await apiClient.post(
                        Routes.AUTH.REFRESH,
                        {}, // Body is empty if relying on cookies
                        { withCredentials: true }
                    );

                    const { accessToken, refreshToken } = res.data.data;

                    set({ accessToken, refreshToken });

                    // Update client cookie if you are maintaining one
                    Cookies.set("accessToken", accessToken, { expires: 1 });

                    return { success: true };
                } catch (error) {
                    // If refresh fails, force logout
                    get().logout();
                    return { success: false, error: "Session expired" };
                }
            },

            // ------------------------
            // INITIALIZE (Auto-login)
            // ------------------------
            initializeAuth: async () => {
                // Check if we have tokens/cookies before making the call
                const token = get().accessToken || Cookies.get("accessToken");
                
                if (!token) {
                    return { success: false };
                }

                try {
                    const res = await apiClient.get(Routes.AUTH.PROFILE, {
                        withCredentials: true,
                    });

                    set({
                        user: res.data.data,
                        isAuthenticated: true,
                    });

                    return { success: true };
                } catch (error) {
                    // If profile fetch fails (e.g., token expired), try refreshing
                    const refreshResult = await get().refreshTokens();
                    if (refreshResult.success) {
                        // Retry profile fetch
                        return get().initializeAuth();
                    } else {
                        // Logout if refresh also fails
                        get().logout();
                        return { success: false };
                    }
                }
            },

            // ------------------------
            // GET PROFILE
            // ------------------------
            getProfile: async () => {
                set({ loading: true, error: null });
                
                // Fix: Access user from state using get()
                const currentUser = get().user;

                try {
                    const res = await apiClient.get(Routes.AUTH.PROFILE, {
                        withCredentials: true,
                    });

                    const userData = res.data.data;

                    // Example: Handle shop_owner specific logic if needed
                    if (userData.user_type === "shop_owner") {
                        // You can fetch shop specific details here if required
                        // const shopRes = await apiClient.get('/shop-details');
                        // userData.shopDetails = shopRes.data;
                    }

                    set({ user: userData, loading: false });
                    return { success: true, user: userData };
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
            // USER UPDATE (Local State)
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
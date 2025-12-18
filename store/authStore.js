"use client";

import apiClient from "@/api/apiClient";
import Routes from "@/api/endpoints";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import { email } from "zod";

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            email:null,
            accessToken: null,
            resetToken:null,
            refreshToken: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            setEmail: (email) => set({ email }),

            /* ---------- AUTH CORE ---------- */
            register: async (userData) => {
                set({ loading: true, error: null });
                try {
                    await apiClient.post(Routes.AUTH.REGISTER, userData);
                    set({ loading: false });
                    return { success: true, message: "Registration successful. Please login." };
                } catch (err) {
                    const msg = err.response?.data?.message || "Registration failed";
                    set({ error: msg, loading: false });
                    return { success: false, error: msg };
                }
            },

            login: async (credentials) => {
                set({ loading: true, error: null });
                try {
                    const res = await apiClient.post(Routes.AUTH.LOGIN, credentials);
                    const { user, accessToken, refreshToken } = res.data.data;

                    Cookies.set("userRole", user.user_type, { expires: 1 });
                    Cookies.set("accessToken", accessToken, { expires: 1 });

                    set({ user, accessToken, refreshToken, isAuthenticated: true, loading: false });
                    return { success: true, user };
                } catch (err) {
                    const msg = err.response?.data?.message || "Login failed";
                    set({ error: msg, loading: false });
                    return { success: false, error: msg };
                }
            },

            socialLogin: async (provider, socialToken) => { // Accept the token here
                set({ loading: true, error: null });
                try {
                    const endpoint = provider === "google"
                        ? Routes.AUTH.SOCIAL.GOOGLE
                        : Routes.AUTH.SOCIAL.FACEBOOK;

                    const res = await apiClient.post(endpoint, { token: socialToken });

                    const { user, accessToken, refreshToken } = res.data.data;

                    Cookies.set("accessToken", accessToken, { expires: 1 });
                    Cookies.set("userRole", user.user_type, { expires: 1 });

                    set({ user, accessToken, refreshToken, isAuthenticated: true, loading: false });
                    return { success: true };
                } catch (err) {
                    const msg = err.response?.data?.message || "Social login failed";
                    set({ error: msg, loading: false });
                    return { success: false, error: msg };
                }
            },

            logout: async () => {
                try {
                    await apiClient.post(Routes.AUTH.LOGOUT, {}, { withCredentials: true });
                } catch (error) {
                    console.error("Logout request failed", error);
                }
                Cookies.remove("accessToken");
                Cookies.remove("userRole");
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            },

            /* ---------- TOKEN MANAGEMENT ---------- */
            refreshTokens: async () => {
                try {
                    const res = await apiClient.post(Routes.AUTH.REFRESH, {}, { withCredentials: true });
                    const { accessToken, refreshToken } = res.data.data;

                    set({ accessToken, refreshToken });
                    Cookies.set("accessToken", accessToken, { expires: 1 });
                    return { success: true };
                } catch (error) {
                    get().logout();
                    return { success: false };
                }
            },

            /* ---------- PROFILE / SESSION ---------- */
            initializeAuth: async () => {
                const token = get().accessToken || Cookies.get("accessToken");
                if (!token) return { success: false };

                try {
                    const res = await apiClient.get(Routes.AUTH.ME);
                    set({ user: res.data.data, isAuthenticated: true });
                    return { success: true };
                } catch (error) {
                    const refreshResult = await get().refreshTokens();
                    if (refreshResult.success) return get().initializeAuth();
                    get().logout();
                    return { success: false };
                }
            },

            /* ---------- OTP PASSWORD RESET FLOW ---------- */
            sendResetOtp: async (email) => {
                set({ loading: true, error: null });
                try {
                    await apiClient.post(Routes.AUTH.PASSWORD.FORGOT, { email });
                    set({ loading: false });
                    return { success: true };
                } catch (err) {
                    const msg = err.response?.data?.message || "Failed to send OTP";
                    set({ error: msg, loading: false });
                    return { success: false };
                }
            },

            resendOtp: async (email) => {
                try {
                    await apiClient.post(Routes.AUTH.PASSWORD.RESEND_OTP, { email });
                    return { success: true };
                } catch (err) {
                    return { success: false, error: err.response?.data?.message };
                }
            },

            /* ---------- ACCOUNT SECURITY ---------- */
            changePassword: async (oldPassword, newPassword) => {
                set({ loading: true, error: null });
                try {
                    await apiClient.post(Routes.AUTH.PASSWORD.CHANGE, { oldPassword, newPassword });
                    set({ loading: false });
                    return { success: true };
                } catch (err) {
                    const msg = err.response?.data?.message || "Failed to change password";
                    set({ error: msg, loading: false });
                    return { success: false };
                }
            },

            setPassword: async (password) => {
                set({ loading: true, error: null });
                try {
                    await apiClient.post(Routes.AUTH.PASSWORD.SET, { password });
                    set({ loading: false });
                    return { success: true };
                } catch (err) {
                    set({ error: err.response?.data?.message, loading: false });
                    return { success: false };
                }
            },
            sendOtp: async (email) => {
                set({ isLoading: true, error: null });
                try {
                    await apiClient.post(Routes.AUTH.PASSWORD.FORGOT, { email });
                    set({ email, isLoading: false });
                    return { success: true };
                } catch (err) {
                    set({ error: err.response?.data?.message || "Error sending OTP", isLoading: false });
                    return { success: false };
                }
            },

            verifyOtp: async (email, otp) => {
                set({ isLoading: true, error: null });
                try {
                    const res = await apiClient.post(Routes.AUTH.PASSWORD.RESEND_OTP, { email, otp });
                    console.log(res)
                    set({ resetToken: res.data.data.reset_token, isLoading: false });
                    console.log(res)
                    return true;
                } catch (err) {
                    set({ error: err.response?.data?.message || "Invalid OTP", isLoading: false });
                    return { success: false };
                }
            },

            resetPassword: async (email, resetToken, newPassword) => {
                set({ isLoading: true, error: null });
                try {
                    await apiClient.post(Routes.AUTH.PASSWORD.RESET, { email, reset_token: resetToken, newPassword });
                    set({ isLoading: false, email: "", resetToken: "" });
                    return { success: true };
                } catch (err) {
                    set({ error: err.response?.data?.message || "Reset failed", isLoading: false });
                    return { success: false };
                }
            },

            /* ---------- UTILS ---------- */
            clearError: () => set({ error: null }),
        }),
        {
            name: "ins03-auth-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({
                accessToken: s.accessToken,
                refreshToken: s.refreshToken,
                isAuthenticated: s.isAuthenticated,
                user: s.user,
            }),
        }
    )
);
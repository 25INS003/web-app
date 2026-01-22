"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useSettingsStore = create(
    persist(
        (set) => ({
            // State
            animationsEnabled: true,
            themeColor: "violet", // default theme preset
            
            // Advanced Theme State
            customColors: {
                background: null,
                foreground: null,
                card: null,
                cardForeground: null,
                popover: null,
                popoverForeground: null,
                primary: null,
                primaryForeground: null,
                secondary: null,
                secondaryForeground: null,
                muted: null,
                mutedForeground: null,
                accent: null,
                accentForeground: null,
                destructive: null,
                destructiveForeground: null,
                border: null,
                input: null,
                ring: null,
            },

            // Actions
            toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),
            setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
            setThemeColor: (color) => set({ themeColor: color }),
            
            setCustomColor: (key, value) => set((state) => ({
                customColors: { ...state.customColors, [key]: value }
            })),
            
            resetTheme: () => set((state) => ({
                themeColor: "violet",
                customColors: {
                    background: null,
                    foreground: null,
                    card: null,
                    cardForeground: null,
                    popover: null,
                    popoverForeground: null,
                    primary: null,
                    primaryForeground: null,
                    secondary: null,
                    secondaryForeground: null,
                    muted: null,
                    mutedForeground: null,
                    accent: null,
                    accentForeground: null,
                    destructive: null,
                    destructiveForeground: null,
                    border: null,
                    input: null,
                    ring: null,
                }
            })),
        }),
        {
            name: "admin-settings-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

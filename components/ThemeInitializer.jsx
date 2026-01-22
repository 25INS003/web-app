"use client";

import React, { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { MotionConfig } from "framer-motion";

// This component handles:
// 1. Applying the global theme variable to :root
// 2. Providing global MotionConfig for disabling animations
// Helper to convert Hex to OKLCH (approximated for saturation/lightness)
// Note: true conversion is complex, this is a simplified bridge for Tailwind v4 oklch variables
const hexToOklch = (hex) => {
    // Remove hash
    hex = hex.replace('#', '');
    
    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Convert to approximate lightness, chroma, hue for OKLCH
    // This isn't perfect but allows us to inject values into oklch(L C H)
    
    // Simplistic approach: calculate lightness
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    
    // We will just return the hex if we can't easily convert to exact oklch channels expected by tailwind
    // Tailwind v4 CSS variables are just values. 
    // IF the user is using the variable inside oklch(), we need channels.
    // IF the variable is just used as a color, we can return hex.
    // globals.css uses: --primary: oklch(0.21...);
    // This means the variable IS the color function.
    // So we can technically replace it with ANYTHING valid like `hex` or `rgb()`.
    
    return `#${hex}`;
};


// This component handles:
// 1. Applying the global theme variable to :root
// 2. Providing global MotionConfig for disabling animations
export const ThemeInitializer = ({ children }) => {
    const { themeColor, animationsEnabled, customColors } = useSettingsStore();

    useEffect(() => {
        const root = document.documentElement;

        // 1. Apply Preset Theme (if no custom override for primary/ring)
        const themes = {
            violet: "oklch(0.55 0.25 280)",   
            blue: "oklch(0.55 0.2 250)",      
            rose: "oklch(0.55 0.2 15)",       
            emerald: "oklch(0.6 0.18 150)",   
            amber: "oklch(0.7 0.18 50)",      
        };

        const presetValue = themes[themeColor] || themes.violet;

        // If custom primary/ring aren't set, use preset
        if (!customColors.primary) root.style.setProperty("--primary", presetValue);
        if (!customColors.ring) root.style.setProperty("--ring", presetValue);
        if (!customColors.primaryForeground) root.style.setProperty("--primary-foreground", "oklch(1 0 0)"); // Default white text

        // 2. Apply Custom Overrides
        Object.entries(customColors).forEach(([key, value]) => {
            if (value) {
                // Tailwind CSS variables often map directly to the property name
                // e.g., customColors.background -> --background
                // customColors.cardForeground -> --card-foreground
                
                const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
                
                // If it's a hex code, we pass it directly.
                // Since globals.css sets "--primary: oklch(...)", replacing it with "#ff0000" works 
                // because standard CSS allows swapping the value.
                root.style.setProperty(cssVar, value);
            } else {
                // If value is cleared (null), remove the inline style to fallback to globals.css
                // UNLESS it's one of our preset managed ones (primary/ring) which we handle above
                if (key !== 'primary' && key !== 'ring') {
                     const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
                     root.style.removeProperty(cssVar);
                }
            }
        });
        
    }, [themeColor, customColors]);

    return (
        <MotionConfig reducedMotion={!animationsEnabled ? "always" : "never"}>
            {children}
        </MotionConfig>
    );
};

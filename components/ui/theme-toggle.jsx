"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export default function ThemeToggle({ className = "" }) {
    const { theme, setTheme } = useTheme();
    const setStoreTheme = useUIStore((s) => s.setTheme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <button aria-hidden className={`inline-flex items-center justify-center p-2 rounded-md ${className}`} />;
    }

    const isDark = theme === "dark";

    const handleToggle = () => {
        const next = isDark ? "light" : "dark";
        setTheme(next);
        // keep zustand store in sync
        try {
            setStoreTheme(next);
        } catch (e) {
            // ignore if store not available
        }
    };

    return (
        <button
            onClick={handleToggle}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Switch to light" : "Switch to dark"}
            className={`inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
        >
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </button>
    );
}

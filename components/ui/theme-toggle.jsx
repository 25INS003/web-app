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

    const Dark = theme === "dark";

    const handleToggle = () => {
        const next = Dark ? "light" : "dark";
        setTheme(next);
        try {
            setStoreTheme(next);
        } catch (e) {
        }
    };

    return (
        <button
            onClick={handleToggle}
            aria-label={Dark ? "Switch to light theme" : "Switch to dark theme"}
            title={Dark ? "Switch to light" : "Switch to dark"}
            className={`inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
        >
            {Dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </button>
    );
}
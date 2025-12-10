"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/store/themeStore";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className={`p-3 rounded-xl transition-all ${
        isDark 
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
      }`}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
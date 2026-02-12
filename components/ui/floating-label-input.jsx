"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const FloatingLabelInput = React.forwardRef(({ className, type, label, icon, value, onChange, children, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const hasValue = value && value.length > 0;
  const isActive = isFocused || hasValue;

  return (
    <div className="relative group">
      {/* Icon Wrapper */}
      {icon && (
        <div className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none z-10",
            isActive ? "text-blue-600" : "text-slate-400"
        )}>
          {icon}
        </div>
      )}

      {/* Input Field */}
      <input
        type={type}
        className={cn(
          "flex w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-1 text-sm shadow-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/10 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 font-medium group-hover:bg-slate-100 dark:group-hover:bg-slate-800 text-slate-900 dark:text-white",
          icon ? "pl-12" : "pl-4",
          "h-14 pt-5 pb-2", // Adjusted padding for perfect cursor centering relative to label
          className
        )}
        ref={ref}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={label} // Placeholder needed for layout but hidden via CSS
        {...props}
      />

      {/* Floating Label */}
      <label
        className={cn(
          "absolute pointer-events-none left-4 transition-all duration-300 ease-out origin-left",
          icon ? "left-12" : "left-4",
          isActive 
            ? "top-2 text-[10px] sm:text-xs font-semibold text-blue-600" 
            : "top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium"
        )}
      >
        {label}
      </label>
      
      {/* Background glow on focus/active - optional enhancement */}
      {isActive && (
          <motion.div 
            layoutId="input-active-glow"
            className="absolute inset-0 rounded-2xl ring-1 ring-blue-600/20 pointer-events-none" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
      )}
      {children}
    </div>
  );
});
FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };

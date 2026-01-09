"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/ui/animated-icons";

const AnimatedCheckbox = React.forwardRef(({ className, checked, onCheckedChange, id, ...props }, ref) => {
  const checkboxRef = React.useRef(null);
  const iconRef = React.useRef(null);

  const handleClick = () => {
    const newChecked = !checked;
    onCheckedChange?.(newChecked);
    // Trigger animation explicitly if needed, but AnimatePresence/key usually handles enter/exit
    if (newChecked) {
        iconRef.current?.startAnimation();
    }
  };

  React.useEffect(() => {
    if (checked) {
        iconRef.current?.startAnimation();
    }
  }, [checked]);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      ref={ref}
      id={id}
      onClick={handleClick}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-md border border-slate-300 dark:border-slate-600 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out",
        checked ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-full h-full">
        {checked && (
             <CheckIcon 
                ref={iconRef}
                size={16} 
                className="text-white pointer-events-none" 
                isAnimated={true}
             />
        )}
      </div>
    </button>
  );
});

AnimatedCheckbox.displayName = "AnimatedCheckbox";

export { AnimatedCheckbox };

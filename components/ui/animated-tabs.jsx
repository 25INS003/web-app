"use client";

import { createContext, useContext, useState, Children, isValidElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TabsContext = createContext({});

export function Tabs({ children, defaultValue, className, onValueChange, value }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  // Allow controlled or uncontrolled
  const currentTab = value !== undefined ? value : activeTab;

  const handleTabChange = (val) => {
      setActiveTab(val);
      if (onValueChange) onValueChange(val);
  }

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: handleTabChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }) {
   return <div className={cn("relative flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-full", className)}>{children}</div>
}

export function TabsTab({ value, children, className }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  
  return (
    <button 
        onClick={() => setActiveTab(value)} 
        className={cn(
            "relative flex-1 py-2.5 text-sm font-semibold transition-colors z-10", 
            isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200", 
            className
        )}
    >
        {isActive && (
            <motion.div 
                layoutId="active-tab-pill" 
                className="absolute inset-x-0 top-1 bottom-1 bg-white dark:bg-slate-600 rounded-full shadow-sm -z-10 mx-1"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
        )}
        {children}
    </button>
  )
}

export function TabsPanels({ children, className }) {
    const { activeTab } = useContext(TabsContext);
    
    // Find the active panel among children
    let activePanel = null;
    Children.forEach(children, (child) => {
        if (isValidElement(child) && child.props.value === activeTab) {
            activePanel = child;
        }
    });
    
    return (
        <div className={cn("relative overflow-hidden", className)}>
             <AnimatePresence mode="wait" initial={false}>
                 {activePanel}
             </AnimatePresence>
        </div>
    )
}

export function TabsPanel({ value, children, className }) {
    return (
        <motion.div
            key={value}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn("w-full focus:outline-none", className)}
        >
            {children}
        </motion.div>
    )
}


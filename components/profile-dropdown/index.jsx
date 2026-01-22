"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Settings, LogOut } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

export default function ProfileDropdown({ className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { logout, loading } = useLogout();

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleToggle = () => setOpen((v) => !v);

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { label: "Profile", icon: User, href: "/dashboard/profile" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        <Avatar className="h-9 w-9 ring-2 ring-slate-200 dark:ring-slate-700">
          <AvatarImage src="https://i.pravatar.cc/150?u=unique" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
            CN
          </AvatarFallback>
        </Avatar>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 z-50 overflow-hidden"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">User Name</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">user@example.com</p>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-1">
              {menuItems.map((item) => (
                <Link 
                  key={item.label}
                  href={item.href} 
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
                      <item.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Logout Button */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-700">
              <motion.button
                onClick={handleLogout}
                disabled={loading}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                          text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 
                          transition-colors disabled:opacity-50"
              >
                <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <span>Logout</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
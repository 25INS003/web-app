"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
    // logout hook handles redirect
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={open}
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
      >
        <Avatar>
          <AvatarImage src="https://i.pravatar.cc/150?u=unique" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white dark:bg-slate-800 border shadow-lg z-20 overflow-hidden">
          <div className="py-1">
            <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>

            <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <div className="w-full px-1 ">
<button
              onClick={handleLogout}
              disabled={loading}
              className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-white
                        rounded-md font-bold
                        dark:text-white hover:bg-red-700 bg-destructive disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
            </div>

            
          </div>
        </div>
      )}
    </div>
  );
}

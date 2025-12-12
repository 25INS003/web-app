"use client";

import { Bell, Search, Plus, Store } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/theme-toggle";
import ProfileDropdown from "@/components/profile-dropdown";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function AdminHeader() {
    const router = useRouter();

    return (
        <div className="h-full w-full flex items-center justify-between border-b bg-slate-50 dark:bg-slate-900 px-6">
            {/* left content */}
            <div className="flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-3 py-2 w-96">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search orders, products, or customers..."
                    className="ml-2 w-full bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                {/* Quick Add Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                            <Plus size={16} />
                            <span>Quick Add</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                            onClick={() => router.push('/shops')}
                            className="cursor-pointer"
                        >
                            <Store className="mr-2 h-4 w-4" />
                            Add New Shop
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => router.push('/products')}
                            className="cursor-pointer"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications */}
                <button className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User menu */}
                <ProfileDropdown />
            </div>
        </div>
    );
}
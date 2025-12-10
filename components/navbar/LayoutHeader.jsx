import { Bell, Search, Plus } from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";
import ProfileDropdown from "@/components/profile-dropdown";

export default function AdminHeader() {
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
                {/* Quick Add Button */}
                <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    <Plus size={16} />
                    <span>Add Product</span>
                </button>

                {/* Notifications */}
                <button className="relative rounded-full p-2 hover:bg-slate-100">
                    <Bell size={20} className="text-slate-600" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User menu */}
                <ProfileDropdown />
            </div>
        </div>
    )
}
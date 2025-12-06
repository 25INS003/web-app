import { Bell, Search, Plus } from "lucide-react";

export default function AdminHeader() {
    return (
        <div className="h-full w-full flex items-center justify-between border-b bg-white px-6">
            {/* left content */}
            <div className="flex items-center rounded-md bg-slate-100 px-3 py-2 w-96">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search orders, products, or customers..."
                    className="ml-2 w-full bg-transparent outline-none text-sm"
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

                {/* Profile Avatar */}
                <div className="h-8 w-8 rounded-full bg-slate-300 overflow-hidden cursor-pointer">
                    <img src="https://i.pravatar.cc/150" alt="Profile" />
                </div>
            </div>
        </div>
    )
}
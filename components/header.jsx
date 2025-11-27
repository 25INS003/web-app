// components/Header.jsx
"use client";

import { useLogout } from "@/hooks/useLogout";

export default function Header() {
    const { logout, loading } = useLogout();

    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            // Optional: Show success message
            console.log("Logged out successfully");
        }
    };

    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Dashboard
                        </h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleLogout}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Logging out...
                                </span>
                            ) : (
                                "Logout"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
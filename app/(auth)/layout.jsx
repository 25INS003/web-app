"use client";

import { usePathname } from 'next/navigation';
import AuthPage from "./auth-page";

export default function AuthLayout({ children }) {
    const pathname = usePathname();
    const isAuthTab = pathname === '/login' || pathname === '/register';

    if (isAuthTab) {
        return <AuthPage />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
             {children}
        </div>
    )
}
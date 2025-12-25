"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [localError, setLocalError] = useState("");
    
    const { resetToken, resetPassword, isLoading, error } = useAuthStore();
    const router = useRouter();

    // Security check: If no resetToken exists, they shouldn't be here
    useEffect(() => {
        if (!resetToken) {
            router.push("/forgot-password");
        }
    }, [resetToken, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError("");

        // 1. Client-side validation
        if (password.length < 8) {
            return setLocalError("Password must be at least 8 characters long");
        }
        if (password !== confirmPassword) {
            return setLocalError("Passwords do not match");
        }

        // 2. Call the Step 4 API (using just the password, token is in store)
        const res = await resetPassword(password);
        
        if (res.success) {
            // Success feedback
            router.push("/login?reset=success");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Set New Password</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Please enter your new secure password below.
                    </p>
                </div>

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {/* Display both local validation errors and backend errors */}
                    {(localError || error) && (
                        <p className="text-sm text-red-600 text-center font-medium">
                            {localError || error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !password || !confirmPassword}
                        className="w-full rounded-md bg-indigo-600 py-2.5 text-white font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-sm"
                    >
                        {isLoading ? "Updating Password..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
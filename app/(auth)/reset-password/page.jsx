"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const { email, resetToken, resetPassword, isLoading, error } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return alert("Passwords do not match");

        const res = await resetPassword(email, resetToken, password);
        if (res.success) {
            alert("Password reset successful!");
            router.push("/login");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">New Password</h2>

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="New Password"
                        required
                        className="block w-full rounded-md border border-gray-300 px-3 py-2"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        required
                        className="block w-full rounded-md border border-gray-300 px-3 py-2"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                        disabled={isLoading}
                        className="w-full rounded-md bg-green-600 py-2 text-white hover:bg-green-700 disabled:bg-green-400"
                    >
                        {isLoading ? "Updating..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
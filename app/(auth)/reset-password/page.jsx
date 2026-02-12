"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [localError, setLocalError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const { resetToken, resetPassword, isLoading, error } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!resetToken) {
            router.push("/forgot-password");
        }
    }, [resetToken, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError("");

        if (password.length < 8) {
            return setLocalError("Password must be at least 8 characters long");
        }
        if (password !== confirmPassword) {
            return setLocalError("Passwords do not match");
        }

        const res = await resetPassword(password);
        
        if (res.success) {
            if (res.userType === "admin") {
                router.push("/admin/login");
            } else {
                router.push("/login?reset=success");
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                 <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px] dark:bg-purple-600/10" />
                 <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[100px] dark:bg-blue-600/10" />
                 <div className="absolute -bottom-[10%] -left-[5%] w-[30%] h-[30%] rounded-full bg-emerald-500/20 blur-[100px] dark:bg-emerald-600/10" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800 p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                            <Lock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            Reset Password
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Create a strong password to secure your account.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Minimum 8 characters"
                                    required
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 pl-10 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    required
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 pl-10 pr-12 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Validation Indicators */}
                        {password && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800"
                            >
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Password Strength:</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                                        password.length >= 8 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                                    }`} />
                                    <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                                        password.match(/[0-9]/) ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                                    }`} />
                                     <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                                        password.match(/[A-Z]/) ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                                    }`} />
                                </div>
                                <div className="grid grid-cols-2 gap-1 mt-1">
                                    <div className={`flex items-center gap-1.5 text-xs ${password.length >= 8 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                                        <Check className="h-3 w-3" /> 8+ Characters
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-xs ${password.match(/[0-9]/) ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                                        <Check className="h-3 w-3" /> Number
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-xs ${password.match(/[A-Z]/) ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                                        <Check className="h-3 w-3" /> Uppercase
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-xs ${password === confirmPassword && password ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                                        <Check className="h-3 w-3" /> Match
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {(localError || error) && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-500/20"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>{localError || error}</p>
                            </motion.div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading || !password || !confirmPassword}
                            className={`w-full h-11 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all ${
                                isLoading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]"
                            }`}
                        >
                            {isLoading ? "Securing Account..." : "Reset Password"}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
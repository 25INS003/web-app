"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { SparklesIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "@/components/ui/animated-icons";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";

export default function AdminLoginPage() {
    const router = useRouter();
    const { login, loading, error, clearError, isAuthenticated } = useAuthStore();

    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
        rememberMe: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    
    // Refs for animated icons
    const mailIconRef = useRef(null);
    const lockIconRef = useRef(null);
    const eyeRef = useRef(null);
    const eyeOffRef = useRef(null);
    
    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/admin");
        }
    }, [isAuthenticated, router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
        if (error) clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(credentials);
        
        if (result.success) {
            // Check if user is actually an admin
            if (result.user?.user_type === "admin") {
                toast.success("Welcome back, Admin!", { description: "Successfully logged in." });
                router.push("/admin");
            } else {
                toast.error("Access Denied", { description: "You are not an authorized administrator." });
                // Logout the non-admin user immediately
                // Note: You might want to call logout() here if your store supports it
            }
        } else {
            toast.error("Login Failed", { description: result.error || "Please check your credentials." });
        }
    };
    
    // Animate icons when password visibility changes
    useEffect(() => {
        if (showPassword) {
            const timer = setTimeout(() => {
                eyeOffRef.current?.startAnimation();
            }, 50);
            return () => clearTimeout(timer);
        } else {
             const timer = setTimeout(() => {
                eyeRef.current?.startAnimation();
            }, 50);
             return () => clearTimeout(timer);
        }
    }, [showPassword]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };


    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 lg:p-8 relative overflow-hidden transition-colors duration-300">
             
             {/* Autofill Fix for Dark Mode & Light Mode */}
             <style jsx global>{`
                /* Dark Mode Autofill */
                .dark input:-webkit-autofill,
                .dark input:-webkit-autofill:hover, 
                .dark input:-webkit-autofill:focus, 
                .dark input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
                    -webkit-text-fill-color: white !important;
                    caret-color: white !important;
                }
                
                /* Light Mode Autofill */
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
                    -webkit-text-fill-color: #0f172a !important;
                    caret-color: #0f172a !important;
                }
             `}</style>

             {/* Ambient Background */}
             <div className="absolute inset-0 z-0 pointer-events-none">
                <Image 
                    src="/login-illustration.png" 
                    alt="Background blur" 
                    fill 
                    className="object-cover blur-3xl opacity-5 dark:opacity-10 scale-110" 
                />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[500px] bg-white dark:bg-slate-800 rounded-3xl shadow-xl dark:shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
            >
                <div className="p-8 md:p-12 flex flex-col">
                    
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center h-12 w-12 bg-blue-600 rounded-xl mb-4 shadow-lg shadow-blue-600/20">
                            <SparklesIcon size={24} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Admin Portal</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to manage your platform</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <FloatingLabelInput
                                name="email"
                                type="email" 
                                label="Admin Email"
                                value={credentials.email}
                                onChange={handleChange}
                                required
                                icon={<MailIcon ref={mailIconRef} size={20} />}
                                onFocus={() => mailIconRef.current?.startAnimation()}
                                className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500"
                            />
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <FloatingLabelInput
                                name="password"
                                type={showPassword ? "text" : "password"} 
                                label="Password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                                icon={<LockIcon ref={lockIconRef} size={20} />}
                                onFocus={() => lockIconRef.current?.startAnimation()}
                                className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500"
                            >
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                                >
                                    {showPassword ? (
                                        <EyeOffIcon ref={eyeOffRef} size={20} className="text-slate-500" slashInitial="hidden" /> 
                                    ) : (
                                        <EyeIcon ref={eyeRef} size={20} className="text-slate-500" />
                                    )}
                                </button>
                            </FloatingLabelInput>
                        </motion.div>

                        <motion.div 
                            className="flex items-center justify-between"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                                <div className="flex items-center gap-2">
                                <AnimatedCheckbox 
                                    id="remember" 
                                    checked={credentials.rememberMe}
                                    onCheckedChange={(checked) => setCredentials(prev => ({ ...prev, rememberMe: checked }))}
                                />
                                <label htmlFor="remember" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Remember me</label>
                                </div>
                                <Link href="/forgot-password?role=admin" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                                Forgot Password?
                                </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
                            >
                                {loading ? "Verifying..." : "Access Dashboard"}
                            </Button>
                        </motion.div>
                    </form>

                     <div className="mt-8 text-center border-t border-slate-100 dark:border-white/5 pt-6">
                        <p className="text-xs text-slate-500 mb-4">Authorized personnel only. All activities are monitored.</p>
                        <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1 group">
                             <span>Go to Provider Login</span>
                             <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                     </div>
                </div>
            </motion.div>
        </div>
    );
}

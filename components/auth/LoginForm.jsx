"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon } from "@/components/ui/animated-icons";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { motion } from "framer-motion";

export default function LoginForm({ switchToRegister }) {
    const router = useRouter();
    const { login, socialLogin, loading, error, clearError } = useAuthStore();

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
        if (error) clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(credentials);
        if (result.success) {
            toast.success("Welcome back!", { description: "Successfully logged in." });
            router.push("/dashboard");
        } else {
            toast.error("Login Failed", { description: result.error || "Please check your credentials." });
        }
    };

    const handleSocial = async (provider) => {
        const result = await socialLogin(provider);
        if (result.success) {
            toast.success(`Welcome with ${provider}!`);
            router.push("/dashboard");
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
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">Welcome Back!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-8">We are happy to see you again.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <FloatingLabelInput
                        name="email"
                        type="email" 
                        label="Enter your email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                        icon={<MailIcon ref={mailIconRef} size={20} />}
                        onFocus={() => mailIconRef.current?.startAnimation()}
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
                        label="Enter your password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                        icon={<LockIcon ref={lockIconRef} size={20} />}
                        onFocus={() => lockIconRef.current?.startAnimation()}
                    >
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:outline-none"
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
                    className="flex items-center justify-between mt-2"
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
                        <label htmlFor="remember" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Remember me</label>
                        </div>
                        <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
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
                        {loading ? "Signing In..." : "Login"}
                    </Button>
                </motion.div>
            </form>

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-slate-800 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">OR</span>
                </div>
            </div>

            {/* Social Buttons */}
            <motion.div 
                className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <Button 
                        variant="outline" 
                        className="w-full h-12 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                        onClick={() => handleSocial('google')}
                >
                    <FcGoogle size={20} />
                    Google
                </Button>
                    <Button 
                        variant="outline" 
                        className="w-full h-12 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                        onClick={() => handleSocial('facebook')}
                >
                    <FaFacebook size={20} className="text-blue-600" />
                    Facebook
                </Button>
            </motion.div>
        </div>
    );
}

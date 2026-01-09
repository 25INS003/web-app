"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, UserIcon, PhoneIcon } from "@/components/ui/animated-icons";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { motion } from "framer-motion";

export default function RegisterForm({ switchToLogin }) {
    const router = useRouter();
    const { register, socialLogin, loading, error, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);

    // Refs for animated icons
    const userIconRef = useRef(null);
    const userLastIconRef = useRef(null);
    const mailIconRef = useRef(null);
    const phoneIconRef = useRef(null);
    const lockIconRef = useRef(null);
    const lockConfirmIconRef = useRef(null);
    const eyeRef = useRef(null);
    const eyeOffRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) clearError();
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Validation Error", { description: "Passwords do not match" });
            return;
        }

        const result = await register({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            email: formData.email,
            password: formData.password,
            user_type: "shop_owner", 
        });

        if (result?.success) {
            toast.success("Account Created!", { description: "Please log in to continue." });
            // Switch to login tab instead of pushing route, for smoother UX
            switchToLogin();
        } else {
             toast.error("Registration Failed", { description: result.error || "Could not create account." });
        }
    };

    const handleSocial = async (provider) => {
        const result = await socialLogin(provider);
        if (result.success) {
            toast.success(`Signed in with ${provider}`);
            router.push("/dashboard");
        }
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">Create Account</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">Join us to manage your shop efficiently.</p>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <FloatingLabelInput 
                            name="first_name"
                            type="text" 
                            label="First Name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                            icon={<UserIcon ref={userIconRef} size={18} />}
                            onFocus={() => userIconRef.current?.startAnimation()}
                        />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <FloatingLabelInput 
                            name="last_name"
                            type="text" 
                            label="Last Name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                            icon={<UserIcon ref={userLastIconRef} size={18} />} 
                            onFocus={() => userLastIconRef.current?.startAnimation()}
                        />
                    </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <FloatingLabelInput 
                        name="email"
                        type="email" 
                        label="Email address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        icon={<MailIcon ref={mailIconRef} size={18} />}
                        onFocus={() => mailIconRef.current?.startAnimation()}
                    />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <FloatingLabelInput 
                        name="phone"
                        type="tel" 
                        label="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        icon={<PhoneIcon ref={phoneIconRef} size={18} />}
                        onFocus={() => phoneIconRef.current?.startAnimation()}
                    />
                </motion.div>

                <div className="grid grid-cols-2 gap-3">
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <FloatingLabelInput 
                            name="password"
                            type={showPassword ? "text" : "password"} 
                            label="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            icon={<LockIcon ref={lockIconRef} size={18} />}
                            onFocus={() => lockIconRef.current?.startAnimation()}
                        />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <FloatingLabelInput 
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"} 
                            label="Confirm"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            icon={<LockIcon ref={lockConfirmIconRef} size={18} />}
                            onFocus={() => lockConfirmIconRef.current?.startAnimation()}
                        >
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOffIcon ref={eyeOffRef} size={16} className="text-slate-500" slashInitial="hidden" />
                                ) : (
                                    <EyeIcon ref={eyeRef} size={16} className="text-slate-500" />
                                )}
                            </button>
                        </FloatingLabelInput>
                    </motion.div>
                </div>


                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all mt-2"
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </Button>
                </motion.div>
            </form>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-slate-800 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">OR</span>
                </div>
            </div>

            <motion.div className="grid grid-cols-2 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <Button 
                        variant="outline" 
                        className="h-12 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 text-sm font-semibold gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                        onClick={() => handleSocial('google')}
                >
                    <FcGoogle size={20} /> Google
                </Button>
                <Button 
                        variant="outline" 
                        className="h-12 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 text-sm font-semibold gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                        onClick={() => handleSocial('facebook')}
                >
                        <FaFacebook size={20} className="text-blue-600" /> Facebook
                </Button>
            </motion.div>
        </div>
    );
}

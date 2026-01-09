"use client";

import { useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { MailIcon } from "@/components/ui/animated-icons";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { sendOtp, loading } = useAuthStore();
    const [email, setEmail] = useState("");

    const mailIconRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            toast.error("Required", { description: "Please enter your email address." });
            return;
        }

        const result = await sendOtp(email);

        if (result.success) {
            toast.success("OTP Sent!", { description: "Check your email for the code." });
            // Navigate to OTP verification page - Assuming /auth/verify-otp or similar. 
            // Since the user didn't specify the next step URL, I'll assume standard flow or stay here.
            // But usually after sending OTP for forgot password, one goes to enter it. 
            // For now, I'll add a comment or just notify. 
            // The store saves the 'email' in state, so the next page can pick it up.
            router.push("/verify-otp"); // Common pattern, adjust if needed later
        } else {
            toast.error("Error", { description: "Failed to send OTP. Please try again." });
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 relative overflow-hidden">
             {/* Ambient Background */}
             <div className="absolute inset-0 z-0 pointer-events-none">
                <Image 
                    src="/login-illustration.png" // Reusing the ambient blur from login if suitable, or just the bg logic
                    alt="Background blur" 
                    fill 
                    className="object-cover blur-3xl opacity-10 scale-110" 
                />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8"
            >
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password?</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Enter your email and we'll send you a 6-digit code.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <FloatingLabelInput 
                            name="email"
                            type="email" 
                            label="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            icon={<MailIcon ref={mailIconRef} size={20} />}
                            onFocus={() => mailIconRef.current?.startAnimation()}
                        />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                        >
                            {loading ? "Sending..." : "Send OTP"}
                        </Button>
                    </motion.div>
                </form>

                <motion.div 
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.4 }}
                >
                    <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                        Back to Login
                    </Link>
                </motion.div>

            </motion.div>
        </div>
    );
}
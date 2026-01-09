"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SparklesIcon } from "@/components/ui/animated-icons";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTab, TabsPanels, TabsPanel } from "@/components/ui/animated-tabs";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";

export default function AuthPage() {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [clientReady, setClientReady] = useState(false);

    // Derive active tab from URL
    const activeTab = pathname.includes("register") ? "register" : "login";

    useEffect(() => {
        setClientReady(true);
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);

    const handleTabChange = (value) => {
        if (value !== activeTab) {
            router.push(`/${value}`);
        }
    };

    // Construct image props based on active tab
    const imageProps = activeTab === "login" 
        ? { src: "/login-illustration.png", alt: "Login Illustration", text: "Empowering shop owners with seamless management tools and real-time insights for a smarter business future." }
        : { src: "/register-illustration.png", alt: "Register Illustration", text: "Start your journey with us today. Manage inventory, track sales, and grow your business with our comprehensive suite of tools." };

    if (!clientReady || isAuthenticated) return null;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 lg:p-8 relative overflow-hidden">
             {/* Ambient Background */}
             <div className="absolute inset-0 z-0 pointer-events-none">
                <Image 
                    src={imageProps.src} 
                    alt="Background blur" 
                    fill 
                    className="object-cover blur-3xl opacity-20 scale-110 transition-all duration-1000" 
                />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[1100px] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden flex h-auto max-h-[95vh] border border-white/20"
            >
                {/* Left Side - Forms and Tabs */}
                <div className="w-full lg:w-1/2 flex flex-col bg-white/80 dark:bg-slate-800/80 backdrop-blur-md overflow-hidden relative">
                    <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 md:p-10 flex flex-col">
                        <div className="my-auto w-full max-w-md mx-auto">
                            
                            {/* Header */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-slate-900 shadow-md">
                                        <SparklesIcon size={18} />
                                    </div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Provider Portal</h1>
                                </div>
                            </div>

                             {/* Tabs Container */}
                             <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="mb-6 grid w-full grid-cols-2">
                                    <TabsTab value="login">Sign In</TabsTab>
                                    <TabsTab value="register">Sign Up</TabsTab>
                                </TabsList>
                                
                                <TabsPanels>
                                    <TabsPanel value="login">
                                        <LoginForm switchToRegister={() => handleTabChange("register")} />
                                    </TabsPanel>
                                    <TabsPanel value="register">
                                        <RegisterForm switchToLogin={() => handleTabChange("login")} />
                                    </TabsPanel>
                                </TabsPanels>
                             </Tabs>

                             <div className="mt-8 text-center">
                                <p className="text-xs text-slate-400">© 2025 Provider Portal. All rights reserved.</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Dynamic Image */}
                <div className="hidden lg:block w-1/2 relative bg-blue-600 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeTab}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="w-full h-full absolute inset-0"
                        >
                            <Image
                                src={imageProps.src}
                                alt={imageProps.alt}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent"></div>
                        </motion.div>
                    </AnimatePresence>

                     <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeTab + "-text"}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="absolute bottom-12 left-12 right-12 p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 text-white shadow-2xl z-10"
                        >
                            <p className="text-lg font-light opacity-95 leading-relaxed italic">
                                "{imageProps.text}"
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    );
}

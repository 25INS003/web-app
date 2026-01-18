"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTheme } from "next-themes";
import { AnimatedMenuIcon } from "@/components/ui/animated-menu-icon";
import { Sun, Moon } from "lucide-react";

export default function Navbar() {
    const [hoveredTab, setHoveredTab] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const navLinks = [
        { name: "Home", href: "#hero" },
        { name: "Features", href: "#features" },
        { name: "Reviews", href: "#reviews" },
        { name: "Workflow", href: "#integrations" },
        { name: "FAQ's", href: "#faq" },
    ];

    const handleScroll = (e, href) => {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            }
        }
    };

    const itemVariants = {
        hidden: { y: -20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 15 }
        }
    };

    const mobileMenuVariants = {
        closed: {
            opacity: 0,
            height: 0,
            transition: {
                duration: 0.3,
                ease: "easeInOut"
            }
        },
        open: {
            opacity: 1,
            height: "auto",
            transition: {
                duration: 0.3,
                ease: "easeInOut"
            }
        }
    };

    const mobileItemVariants = {
        closed: { x: -20, opacity: 0 },
        open: { x: 0, opacity: 1 }
    };

    return (
        <>
            <motion.nav 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="w-full py-3 px-4 sm:px-6 lg:px-12 flex items-center justify-between fixed top-0 left-0 z-50"
            >
                {/* Glassmorphism Background */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50" 
                />
                
                {/* Logo */}
                <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 relative z-10">
                        <Image 
                            src="/log.png" 
                            alt="Nedyway Logo" 
                            width={36} 
                            height={36} 
                            className="rounded-xl sm:w-10 sm:h-10"
                        />
                        <span className="text-lg sm:text-xl font-bold tracking-tight text-white">Nedyway</span>
                    </Link>
                </motion.div>

                {/* Links - Desktop */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1"
                    onMouseLeave={() => setHoveredTab(null)}
                >
                    {navLinks.map((link, i) => (
                        <motion.div key={link.name} variants={itemVariants}>
                            <a 
                                href={link.href}
                                onClick={(e) => handleScroll(e, link.href)}
                                className={`relative px-4 py-2 text-sm font-medium transition-colors z-10 cursor-pointer ${
                                    hoveredTab === link.name 
                                        ? "text-primary" 
                                        : "text-slate-400 hover:text-primary"
                                }`}
                                onMouseEnter={() => setHoveredTab(link.name)}
                            >
                                {hoveredTab === link.name && (
                                    <motion.span
                                        layoutId="nav-pill"
                                        className="absolute inset-0 rounded-lg -z-10 bg-primary/10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                                {link.name}
                            </a>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA - Desktop */}
                <motion.div 
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="hidden md:flex items-center gap-3 relative z-10"
                    onMouseLeave={() => setHoveredTab(null)}
                >
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all duration-200"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-5 h-5" />
                        ) : (
                            <Moon className="w-5 h-5" />
                        )}
                    </button>
                     <Link 
                        href="/login" 
                        className={`relative text-sm font-medium px-4 py-2 transition-colors ${
                            hoveredTab === "Login" 
                                ? "text-primary" 
                                : "text-slate-400 hover:text-primary"
                        }`}
                        onMouseEnter={() => setHoveredTab("Login")}
                     >
                        {hoveredTab === "Login" && (
                            <motion.span
                                layoutId="nav-pill"
                                className="absolute inset-0 rounded-lg -z-10 bg-primary/10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                        )}
                        Login
                     </Link>
                    <Link href="/register">
                        <Button className="rounded-full h-10 px-5 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 duration-300 border border-white/10">
                            Request Access
                        </Button>
                    </Link>
                </motion.div>

                {/* Mobile Menu Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="relative z-10 md:hidden p-2 text-white hover:text-primary transition-colors"
                    aria-label="Toggle menu"
                >
                    <AnimatedMenuIcon isOpen={isMobileMenuOpen} />
                </motion.button>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Menu Panel */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-[280px] bg-slate-950 border-l border-slate-800/50 z-50 md:hidden overflow-y-auto"
                    >
                        {/* Mobile Menu Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                            <span className="text-lg font-bold text-white">Menu</span>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-white hover:text-primary transition-colors"
                                aria-label="Close menu"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        </div>

                        {/* Mobile Menu Links */}
                        <div className="p-4 space-y-1">
                            {navLinks.map((link, i) => (
                                <motion.a
                                    key={link.name}
                                    href={link.href}
                                    onClick={(e) => handleScroll(e, link.href)}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center px-4 py-3 text-base font-medium text-slate-300 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
                                >
                                    {link.name}
                                </motion.a>
                            ))}
                        </div>

                        {/* Mobile Menu Divider */}
                        <div className="mx-4 border-t border-slate-800/50" />

                        {/* Mobile Menu Actions */}
                        <div className="p-4 space-y-3">
                            {/* Theme Toggle - Mobile */}
                            <button
                                onClick={toggleTheme}
                                className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-slate-300 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200 border border-slate-800 gap-2"
                            >
                                {theme === 'dark' ? (
                                    <><Sun className="w-5 h-5" /> Light Mode</>
                                ) : (
                                    <><Moon className="w-5 h-5" /> Dark Mode</>
                                )}
                            </button>
                            <Link 
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-slate-300 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200 border border-slate-800"
                            >
                                Login
                            </Link>
                            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button className="w-full rounded-xl h-12 bg-gradient-to-r from-primary to-purple-600 text-white text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95 duration-300 border border-white/10">
                                    Request Access
                                </Button>
                            </Link>
                        </div>

                        {/* Mobile Menu Footer */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800/50">
                            <p className="text-xs text-slate-500 text-center">© 2024 Nedyway</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

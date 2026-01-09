"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Navbar() {
    const [hoveredTab, setHoveredTab] = useState(null);

    const navLinks = [
        { name: "Home", href: "#hero" },
        { name: "Features", href: "#features" },
        { name: "Workflow", href: "#integrations" },
        { name: "Reviews", href: "#reviews" },
        { name: "FAQ's", href: "#faq" },
    ];

    const handleScroll = (e, href) => {
        e.preventDefault();
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

    return (
        <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full py-3 px-6 lg:px-12 flex items-center justify-between fixed top-0 left-0 z-50"
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
                <Link href="/" className="flex items-center gap-3 relative z-10">
                    <Image 
                        src="/log.png" 
                        alt="Nedyway Logo" 
                        width={40} 
                        height={40} 
                        className="rounded-xl"
                    />
                    <span className="text-xl font-bold tracking-tight text-white">Nedyway</span>
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

            {/* CTA */}
            <motion.div 
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center gap-3 relative z-10"
                onMouseLeave={() => setHoveredTab(null)}
            >
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
                    <Button className="rounded-full h-10 px-5 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 duration-300 border border-white/10 hover:bg-gradient-to-r hover:from-primary hover:to-purple-600">
                        Request Access
                    </Button>
                </Link>
            </motion.div>
        </motion.nav>
    );
}

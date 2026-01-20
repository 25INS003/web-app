"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SparklesIcon, InstagramIcon, GithubIcon, TwitterIcon } from "@/components/ui/animated-icons";
import { motion, LayoutGroup } from "framer-motion";
import { MoveRightIcon } from "@/components/ui/move-right-icon";

export const CTA = () => {
    const iconRef = React.useRef(null);

    return (
        <section className="w-full relative overflow-hidden bg-slate-100 dark:bg-slate-950 py-20 sm:py-40 text-center px-4 sm:px-6">
            {/* Background Effects */}
            <div className="absolute inset-0 w-full h-full">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]"></div>
                
                {/* Gradient Orbs */}
                <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[150px] opacity-30"></div>
                <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/20 blur-[150px] opacity-30"></div>
                
                {/* Radial Gradient Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#f1f5f9_70%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,#020617_70%)]"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-8"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Start Today — No Credit Card Required
                    </span>
                </motion.div>

                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 sm:mb-8 leading-[1.15] sm:leading-[1.1]"
                >
                    Ready to manage your
                    <br />
                    products{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-400">
                        like a pro?
                    </span>
                </motion.h2>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12"
                >
                    Join thousands of shop providers who are streamlining their inventory and sales with our powerful administration tools.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    viewport={{ once: true }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16"
                >
                    <Button
                        asChild
                        size="lg"
                        className="w-full sm:w-auto rounded-full h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%] hover:bg-right text-white shadow-2xl shadow-primary/30 transition-all duration-500 hover:scale-105 active:scale-95 border border-white/10"
                        onMouseEnter={() => iconRef.current?.startAnimation()}
                        onMouseLeave={() => iconRef.current?.stopAnimation()}
                    >
                        <Link href="/register" className="flex items-center gap-2">
                            Request Admin Access
                            <MoveRightIcon ref={iconRef} size={22} />
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        size="lg"
                        className="w-full sm:w-auto rounded-full h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-medium bg-slate-200 dark:bg-white/5 backdrop-blur-sm border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-slate-600 transition-all"
                    >
                        <Link href="/login">Log in to existing account</Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
};

export const Footer = () => {
    const [hoveredBottomLink, setHoveredBottomLink] = React.useState(null);
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
        }
    };

    return (
        <footer className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 sm:px-6">
            {/* Main Footer Content */}
            <div className="container mx-auto max-w-7xl">
                
                {/* Top Section: Logo + Links Grid */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-8 pb-12 sm:pb-16 border-b border-slate-200 dark:border-slate-800/50"
                >
                    
                    {/* Brand Column */}
                    <motion.div variants={itemVariants} className="col-span-2 md:col-span-2 lg:col-span-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-gradient-to-br from-primary to-purple-600 text-white p-3 rounded-2xl rounded-tr-sm shadow-lg shadow-primary/20">
                                <SparklesIcon size={24} className="text-white" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nedyway</span>
                        </div>
                        <p className="mb-8 max-w-sm text-base leading-relaxed text-slate-500">
                            The modern administration platform for shop providers. Manage inventory, track orders, and grow your business.
                        </p>
                        <div className="flex gap-4">
                            <FooterSocialLink icon={<InstagramIcon size={20} />} label="Instagram" />
                            <FooterSocialLink icon={<GithubIcon size={20} />} label="GitHub" />
                            <FooterSocialLink icon={<TwitterIcon size={18} />} label="Twitter" />
                        </div>
                    </motion.div>

                    {/* Links Columns */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <FooterColumn 
                            title="Product" 
                            links={["Features", "Pricing", "Integrations", "Changelog"]} 
                        />
                    </motion.div>

                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <FooterColumn 
                            title="Support" 
                            links={["Documentation", "API Reference", "System Status", "Contact"]} 
                        />
                    </motion.div>

                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <FooterColumn 
                            title="Legal" 
                            links={["Privacy Policy", "Terms of Service", "Cookie Policy"]} 
                        />
                    </motion.div>

                    {/* Newsletter Column */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Stay Updated</h4>
                        <p className="text-sm text-slate-500 mb-4">Get the latest news and updates.</p>
                        <div className="space-y-3">
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                            <button className="w-full bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-bold px-4 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98]">
                                Subscribe
                            </button>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Bottom Bar */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6"
                >
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-slate-600">© 2024 Nedyway. All Rights Reserved.</p>
                        <span className="hidden md:inline-block px-2 py-1 bg-slate-200 dark:bg-slate-900 rounded-md text-xs text-slate-500 border border-slate-300 dark:border-slate-800">v2.1.0</span>
                    </div>
                    <LayoutGroup>
                        <div 
                            className="flex items-center gap-1"
                            onMouseLeave={() => setHoveredBottomLink(null)}
                        >
                            {["Privacy", "Terms", "Cookies"].map((link) => (
                                <a 
                                    key={link}
                                    href="#" 
                                    className={`relative text-sm px-4 py-2 transition-colors z-10 ${
                                        hoveredBottomLink === link 
                                            ? 'text-primary' 
                                            : 'text-slate-500 hover:text-primary'
                                    }`}
                                    onMouseEnter={() => setHoveredBottomLink(link)}
                                >
                                    {hoveredBottomLink === link && (
                                        <motion.span
                                            layoutId="footer-bottom-pill"
                                            className="absolute inset-0 rounded-lg bg-primary/10"
                                            style={{ zIndex: -1 }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                        />
                                    )}
                                    <span className="relative z-10">{link}</span>
                                </a>
                            ))}
                        </div>
                    </LayoutGroup>
                </motion.div>
            </div>
        </footer>
    );
};

const FooterColumn = ({ title, links }) => {
    const [hovered, setHovered] = React.useState(null);

    return (
        <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6">{title}</h4>
            <ul className="flex flex-col gap-2 items-start" onMouseLeave={() => setHovered(null)}>
                {links.map((link) => (
                    <li key={link} className="relative">
                        <a 
                            href="#" 
                            className={`block px-3 py-2 -ml-3 text-sm transition-colors relative z-10 w-fit ${hovered === link ? "text-primary" : "text-slate-600 dark:text-slate-400 hover:text-primary"}`}
                            onMouseEnter={() => setHovered(link)}
                        >
                            {hovered === link && (
                                <motion.span
                                    layoutId={`footer-pill-${title}`}
                                    className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            {link}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const FooterSocialLink = ({ icon, label }) => (
    <a 
        href="#" 
        aria-label={label}
        className="h-12 w-12 flex items-center justify-center bg-slate-200 dark:bg-slate-900 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 hover:border-primary/50 text-slate-600 dark:text-slate-400 hover:text-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
    >
        <span className="flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            {icon}
        </span>
    </a>
);


"use client";

import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "@/components/ui/user-plus-icon";
import { DatabaseIcon } from "@/components/ui/database-icon";
import { TrendingUpIcon } from "@/components/ui/trending-up-icon";
import { MoveRightIcon } from "@/components/ui/move-right-icon";
import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const features = [
    {
        icon: UserPlusIcon,
        title: "Instant Onboarding",
        description: "Forget lengthy setups. Connect your existing inventory sources, invite your team, and start managing your portfolio in under 5 minutes. We handle the complexity so you can focus on leading.",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        gradient: "from-blue-500/20 to-blue-600/5",
        btnText: "Start Connection"
    },
    {
        icon: DatabaseIcon,
        title: "Real-time Sync",
        description: "Never oversell again. Our powerful engine synchronizes your stock levels across every channel instantly. Whether it's a sale on your site or a marketplace, your numbers are always accurate.",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        gradient: "from-purple-500/20 to-purple-600/5",
        btnText: "Sync Now"
    },
    {
        icon: TrendingUpIcon,
        title: "Smart Growth",
        description: "Turn data into decisions. Access advanced analytics that predict trends, identify best-sellers, and alert you to restock. Scale your operations with confidence backed by real intelligence.",
        color: "text-pink-500",
        bg: "bg-pink-500/10",
        gradient: "from-pink-500/20 to-pink-600/5",
        btnText: "View Analytics"
    }
];

export default function Integrations() {
    const [activeFeature, setActiveFeature] = useState(0);
    const [sectionInView, setSectionInView] = useState(true);
    const containerRef = useRef(null);
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Track if the sticky section is in view
    const isSectionVisible = useInView(sectionRef, { margin: "-20% 0px -20% 0px" });

    useEffect(() => {
        setSectionInView(isSectionVisible);
    }, [isSectionVisible]);

    return (
        <section id="integrations" ref={containerRef} className="w-full bg-slate-50 dark:bg-slate-950 px-6 py-24 md:py-40 relative">
            <div className="container mx-auto max-w-6xl">
                 <div className="text-center mb-24 md:mb-40">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6"
                    >
                        Seamless Intelligence <br />
                        <span className="text-primary">at every step.</span>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
                    >
                        Scroll to explore how Nedyway transforms your workflow from day one.
                    </motion.p>
                </div>

                <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative">
                    {/* Left Column: Scrolling Text */}
                    <div className="flex flex-col gap-[50vh] pb-[50vh]">
                        {features.map((feature, index) => (
                            <FeatureText 
                                key={index} 
                                feature={feature} 
                                index={index} 
                                setActiveFeature={setActiveFeature} 
                            />
                        ))}
                    </div>

                    {/* Right Column: Sticky Visual - Wide Feature Card */}
                    <div className={cn("hidden md:block sticky top-32 h-fit transition-opacity duration-300", sectionInView ? "opacity-100" : "opacity-0 pointer-events-none")}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFeature}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                                className="relative"
                            >
                                {/* Main Card */}
                                <div className="w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-8 relative overflow-hidden">
                                    
                                    {/* Background Gradient Blob */}
                                    <div className={cn("absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-20 transition-colors duration-700", features[activeFeature].bg.replace("/10", ""))} />
                                    
                                    {/* Header Row: Badge + Title */}
                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div>
                                            <span className={cn("inline-block px-3 py-1 text-xs font-bold rounded-full mb-4 border", 
                                                features[activeFeature].color, 
                                                features[activeFeature].bg,
                                                features[activeFeature].color.replace("text-", "border-") + "/30"
                                            )}>
                                                Step 0{activeFeature + 1}
                                            </span>
                                            <h3 className="text-3xl font-bold text-white">{features[activeFeature].title}</h3>
                                        </div>
                                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-full">
                                            Active
                                        </div>
                                    </div>

                                    {/* Content Row: Icon + Description */}
                                    <div className="flex items-center gap-8 relative z-10 mb-8">
                                        <div className={cn("w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ring-1 ring-white/10", features[activeFeature].bg)}>
                                            {React.createElement(features[activeFeature].icon, { 
                                                size: 48, 
                                                className: features[activeFeature].color,
                                                isAnimated: true 
                                            })}
                                        </div>
                                        <p className="text-slate-400 text-lg leading-relaxed">
                                            {features[activeFeature].description}
                                        </p>
                                    </div>

                                    {/* Footer: Status Bar */}
                                    <div className="relative z-10 bg-slate-950/50 rounded-xl p-4 border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-slate-400">System Status</span>
                                            <span className="text-sm font-bold text-white">Optimal</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1, ease: "circOut", delay: 0.1 }}
                                                className={cn("h-full rounded-full", features[activeFeature].color.replace("text-", "bg-"))}
                                            />
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeatureText({ feature, index, setActiveFeature }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-50% 0px -50% 0px" });

    useEffect(() => {
        if (isInView) {
            setActiveFeature(index);
        }
    }, [isInView, index, setActiveFeature]);

    return (
        <div ref={ref} className="min-h-[50vh] flex flex-col justify-center">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-2xl font-bold transition-colors duration-500", 
                 isInView ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl scale-110" : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600")}>
                0{index + 1}
            </div>
            <h3 className={cn("text-3xl md:text-5xl font-bold mb-6 transition-colors duration-500", 
                isInView ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-700")}>
                {feature.title}
            </h3>
            <p className={cn("text-lg md:text-xl leading-relaxed mb-8 max-w-md transition-colors duration-500", 
                isInView ? "text-slate-600 dark:text-slate-400" : "text-slate-300 dark:text-slate-700")}>
                {feature.description}
            </p>
            <Button 
                variant="outline" 
                className={cn("w-fit rounded-full transition-all duration-300", 
                    isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none")}
            >
                {feature.btnText} <MoveRightIcon className="ml-2 w-4 h-4" />
            </Button>
        </div>
    );
}

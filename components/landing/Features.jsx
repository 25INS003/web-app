"use client";

import { useRef } from "react";
import { BoxesIcon } from "@/components/ui/boxes"; 
import { CloudUploadIcon } from "@/components/ui/cloud-upload";
import { FileTextIcon } from "@/components/ui/file-text";
import { UsersIcon } from "@/components/ui/users";
import { ShieldCheckIcon } from "@/components/ui/shield-check";
import { DashboardIcon } from "@/components/ui/animated-icons";

const FeatureCard = ({ icon: Icon, title, description }) => {
    const iconRef = useRef(null);

    return (
        <div 
            onMouseEnter={() => iconRef.current?.startAnimation?.()}
            onMouseLeave={() => iconRef.current?.stopAnimation?.()}
            className="flex flex-col items-center text-center p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/10 border border-slate-200 dark:border-white/10 hover:border-primary/30 hover:ring-2 hover:ring-primary/20 group relative overflow-hidden hover:-translate-y-1"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors duration-500" />
            
            <div className="relative z-10 w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center text-primary text-3xl sm:text-4xl mb-4 sm:mb-6 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 sm:group-hover:scale-125 group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
                <Icon ref={iconRef} size={32} />
            </div>
            <h3 className="relative z-10 text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 group-hover:text-primary transition-colors duration-300">{title}</h3>
            <p className="relative z-10 text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                {description}
            </p>
        </div>
    );
};

export default function Features() {
    return (
        <section id="features" className="w-full py-16 sm:py-24 bg-white dark:bg-slate-950">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                <div className="text-center mb-16">
                     <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-purple-100 text-purple-600 font-semibold text-xs sm:text-sm uppercase tracking-wide">Included Features</span>
                     <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
                        Everything you need to succeed
                     </h2>
                     <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
                        A complete suite of tools to manage your products, orders, and customers in one place.
                     </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                    <FeatureCard 
                        icon={DashboardIcon}
                        title="Smart Dashboard"
                        description="Real-time overview of your store's performance at a glance."
                    />
                    <FeatureCard 
                        icon={BoxesIcon} 
                        title="Product Management"
                        description="Easily add, edit, and organize your product catalog."
                    />
                    <FeatureCard 
                        icon={FileTextIcon}
                        title="Order Fulfillment"
                        description="Streamline your shipping and delivery processes efficiently."
                    />
                     <FeatureCard 
                        icon={CloudUploadIcon}
                        title="Inventory Control"
                        description="Keep track of stock levels and prevent sold-out situations."
                    />
                    <FeatureCard 
                        icon={UsersIcon}
                        title="Customer Insights"
                        description="Understand your audience with detailed behavior analytics."
                    />
                    <FeatureCard 
                        icon={ShieldCheckIcon}
                        title="Secure Platform"
                        description="Enterprise-grade security to protect your business data."
                    />
                </div>
            </div>
        </section>
    );
}

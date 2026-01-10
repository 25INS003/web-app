"use client";

import { useRef } from "react";
import { BoxesIcon } from "@/components/ui/boxes"; 
import { FileTextIcon } from "@/components/ui/file-text";
import { ShieldCheckIcon } from "@/components/ui/shield-check";
import { DashboardIcon } from "@/components/ui/animated-icons";
import { TruckIcon, LeafIcon, RupeeIcon, StoreIcon, CommunityIcon } from "@/components/ui/customer-icons";

// Hover colors for different audience types - internal glow only
const audienceStyles = {
    shopkeeper: {
        glow: "group-hover:bg-purple-500/25"
    },
    customer: {
        glow: "group-hover:bg-green-500/25"
    },
    explorer: {
        glow: "group-hover:bg-blue-500/25"
    }
};

const FeatureCard = ({ icon: Icon, title, description, audience }) => {
    const iconRef = useRef(null);
    const style = audienceStyles[audience];

    return (
        <div 
            onMouseEnter={() => iconRef.current?.startAnimation?.()}
            onMouseLeave={() => iconRef.current?.stopAnimation?.()}
            className="flex flex-col items-center text-center p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 shadow-sm hover:shadow-lg border border-slate-200 dark:border-white/10 group relative overflow-hidden hover:-translate-y-1"
        >
            {/* Colored inner glow on hover */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 bg-transparent rounded-full blur-3xl ${style.glow} transition-colors duration-500`} />
            <div className={`absolute -bottom-10 -left-10 w-40 h-40 bg-transparent rounded-full blur-3xl ${style.glow} transition-colors duration-500`} />
            
            <div className="relative z-10 w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center text-primary text-3xl sm:text-4xl mb-4 sm:mb-6 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 sm:group-hover:scale-125 group-hover:shadow-md transition-all duration-300">
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
                <div className="text-center mb-10 sm:mb-16">
                     <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-purple-100 text-purple-600 font-semibold text-xs sm:text-sm uppercase tracking-wide">Why Choose Nedyway</span>
                     <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4">
                        Built for Everyone
                     </h2>
                     <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
                        Whether you're a shopkeeper, customer, or just exploring — we've got something for you.
                     </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                    {/* Shopkeeper Cards */}
                    <FeatureCard 
                        icon={DashboardIcon}
                        title="Smart Dashboard"
                        description="Real-time overview of your store's performance, sales trends, and inventory at a glance."
                        audience="shopkeeper"
                    />
                    <FeatureCard 
                        icon={BoxesIcon} 
                        title="Easy Inventory"
                        description="Manage your stock effortlessly. Get alerts for low stock and automate reordering."
                        audience="shopkeeper"
                    />
                    <FeatureCard 
                        icon={FileTextIcon}
                        title="Order Management"
                        description="Track, fulfill, and manage orders seamlessly from one powerful dashboard."
                        audience="shopkeeper"
                    />
                    
                    {/* Customer Cards */}
                    <FeatureCard 
                        icon={TruckIcon}
                        title="Lightning Fast Delivery"
                        description="Get your orders delivered within hours, not days. Our optimized logistics ensure freshness at your doorstep."
                        audience="customer"
                    />
                    <FeatureCard 
                        icon={LeafIcon}
                        title="Farm Fresh Guarantee"
                        description="Directly sourced from local farms and vendors. No middlemen means fresher products for you."
                        audience="customer"
                    />
                    <FeatureCard 
                        icon={RupeeIcon}
                        title="Unbeatable Prices"
                        description="By cutting out middlemen and sourcing locally, we pass the savings directly to you."
                        audience="customer"
                    />
                    
                    {/* Community Cards */}
                    <FeatureCard 
                        icon={StoreIcon}
                        title="Support Local Vendors"
                        description="Every purchase helps local farmers and small businesses thrive in their communities."
                        audience="explorer"
                    />
                    <FeatureCard 
                        icon={CommunityIcon}
                        title="Growing Community"
                        description="Join thousands of happy customers and vendors building a sustainable local economy."
                        audience="explorer"
                    />
                    <FeatureCard 
                        icon={ShieldCheckIcon}
                        title="Trusted & Secure"
                        description="Enterprise-grade security protects your data. Shop and sell with complete peace of mind."
                        audience="explorer"
                    />
                </div>
            </div>
        </section>
    );
}

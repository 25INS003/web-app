"use client";

import { FaSlack, FaDropbox, FaAmazonPay } from "react-icons/fa";
import { SiCoinbase, SiWebflow, SiZoom } from "react-icons/si";

export default function LogoStrip() {
    // Using a mix of real icons and text to simulate the logo strip in the image
    const logos = [
        { name: "coinbase", icon: <SiCoinbase size={24} />, label: "coinbase" },
        { name: "slack", icon: <FaSlack size={24} />, label: "slack" },
        { name: "dropbox", icon: <FaDropbox size={24} />, label: "Dropbox" },
        { name: "webflow", icon: <SiWebflow size={24} />, label: "webflow" },
        { name: "zoom", icon: <SiZoom size={28} />, label: "zoom" },
    ];

    return (
        <section className="w-full py-12 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="container mx-auto max-w-6xl">
                 <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-16 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                    {logos.map((logo) => (
                        <div key={logo.name} className="flex items-center gap-2 text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300">
                            {logo.icon}
                            <span>{logo.label}</span>
                        </div>
                    ))}
                 </div>
            </div>
        </section>
    );
}

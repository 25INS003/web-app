"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { StarIcon } from "lucide-react";

const reviews = [
    {
        name: "Elena Rodriguez",
        role: "Chain Store Owner",
        content: "Nedyway's inventory syncing is a lifesaver. I can manage stock across 5 locations without a single spreadsheet. It's truly unified administration.",
        avatar: "https://randomuser.me/api/portraits/women/12.jpg"
    },
    {
        name: "Marcus Chen",
        role: "Warehouse Manager",
        content: "The real-time order tracking on the dashboard prevents so many shipping errors. It's the most reliable admin tool I've used in 10 years.",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg"
    },
    {
        name: "Sophia Patel",
        role: "E-commerce Director",
        content: "Finally, a provider portal that actually looks good and works fast. The sales reports help us pivot our strategy instantly.",
        avatar: "https://randomuser.me/api/portraits/women/33.jpg"
    },
    {
        name: "David Okonjo",
        role: "Logistics Coordinator",
        content: "Nedyway simplifies complex vendor management. Onboarding new suppliers went from taking weeks to just days.",
        avatar: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    {
        name: "Emma Wright",
        role: "Boutique Owner",
        content: "I love how easy it is to update product variants. The interface is so clean, I actually enjoy doing administrative work now.",
        avatar: "https://randomuser.me/api/portraits/women/55.jpg"
    },
    {
        name: "James Wilson",
        role: "Operations VP",
        content: "We switched to Nedyway for the security features, but stayed for the analytics. It gives us a granular view of our entire supply chain.",
        avatar: "https://randomuser.me/api/portraits/men/67.jpg"
    },
     {
        name: "Anna Polina",
        role: "Retail Manager",
        content: "The automated low-stock alerts have saved us from running out of best-sellers multiple times. Highly recommended!",
        avatar: "https://randomuser.me/api/portraits/women/71.jpg"
    },
    {
        name: "Robert Fox",
        role: "Technical Lead",
        content: "The API integration was flawless. We connected Nedyway to our custom ERP in less than a day.",
        avatar: "https://randomuser.me/api/portraits/men/82.jpg"
    }
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({ review }) => (
    <div className="flex-shrink-0 w-[280px] sm:w-[400px] p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mx-2 sm:mx-4">
        <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} size={16} className="fill-yellow-400 text-yellow-400" />
            ))}
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-sm">
            "{review.content}"
        </p>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden relative bg-slate-200">
                <Image 
                    src={review.avatar} 
                    alt={review.name}
                    fill
                    className="object-cover"
                />
            </div>
            <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{review.name}</h4>
                <p className="text-xs text-slate-500">{review.role}</p>
            </div>
        </div>
    </div>
);

export default function Reviews() {
    return (
        <section id="reviews" className="w-full py-16 sm:py-24 bg-white dark:bg-slate-950 overflow-hidden relative flex flex-col gap-6 sm:gap-8">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white dark:from-slate-950 dark:via-transparent dark:to-slate-950 z-10 pointer-events-none" />
            
            <div className="container mx-auto px-4 sm:px-6 mb-4 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">Trusted by Market Leaders</h2>
                <p className="text-slate-500 max-w-xl mx-auto">See how top retailers are scaling their operations with Nedyway.</p>
            </div>

            {/* First Row - Moves Left */}
            <div className="flex overflow-hidden">
                <motion.div 
                    initial={{ x: 0 }}
                    animate={{ x: "-50%" }}
                    transition={{ 
                        duration: 50,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="flex"
                >
                    {[...firstRow, ...firstRow, ...firstRow].map((review, idx) => (
                        <ReviewCard key={`row1-${idx}`} review={review} />
                    ))}
                </motion.div>
            </div>

            {/* Second Row - Moves Right */}
            <div className="flex overflow-hidden">
                <motion.div 
                    initial={{ x: "-50%" }}
                    animate={{ x: 0 }}
                    transition={{ 
                        duration: 50,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="flex"
                >
                    {[...secondRow, ...secondRow, ...secondRow].map((review, idx) => (
                        <ReviewCard key={`row2-${idx}`} review={review} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

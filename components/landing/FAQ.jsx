"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AccordionItem = ({ question, answer, isOpen, onClick }) => (
    <div className="border-b border-slate-200 dark:border-slate-800">
        <button 
            onClick={onClick}
            className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
        >
            <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors pr-8">
                {question}
            </span>
            {/* Animated Plus/Minus Icon */}
            <div className="relative w-6 h-6 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                {/* Horizontal Line (always visible) */}
                <motion.span 
                    className="absolute w-4 h-0.5 bg-current rounded-full"
                />
                {/* Vertical Line (rotates to form + or -) */}
                <motion.span 
                    className="absolute w-4 h-0.5 bg-current rounded-full"
                    initial={false}
                    animate={{ rotate: isOpen ? 0 : 90 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                />
            </div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                >
                    <p className="pb-6 text-slate-600 dark:text-slate-400 leading-relaxed">
                        {answer}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = [
        {
            question: "Who can access this portal?",
            answer: "This portal is strictly for authorized shop providers and administrators. It is not open to the general public or customers."
        },
        {
            question: "How do I request access?",
            answer: "If you are a new shop owner, please contact the main administration office or use the 'Request Access' button to submit your details for verification."
        },
        {
            question: "Can I manage multiple stores?",
            answer: "Yes, the portal supports multi-store management. You can switch between different shop contexts from your dashboard."
        },
        {
            question: "How often are reports updated?",
            answer: "Sales and inventory reports are updated in real-time as transactions occur across the platform."
        },
        {
            question: "Is there a mobile app for admins?",
            answer: "This web portal is fully responsive and optimized for mobile browsers, allowing you to manage your shop on the go."
        }
    ];

    return (
        <section id="faq" className="w-full py-24 bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto max-w-6xl px-6 grid md:grid-cols-12 gap-12">
                <div className="md:col-span-4">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6"
                    >
                        Frequently asked questions
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 dark:text-slate-400 mb-8"
                    >
                        Common questions about the Provider Portal and administration tools.
                    </motion.p>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="inline-block px-5 py-2.5 bg-primary/10 text-primary font-semibold rounded-full text-sm border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                        Contact Support
                    </motion.div>
                </div>
                <div className="md:col-span-8">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <AccordionItem 
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openIndex === index}
                                onClick={() => setOpenIndex(index === openIndex ? -1 : index)}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

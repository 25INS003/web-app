"use client";

import { motion } from "framer-motion";

export const AnimatedMenuIcon = ({ isOpen, className = "" }) => {
    return (
        <div className={`relative w-6 h-5 flex flex-col justify-between ${className}`}>
            <motion.span
                animate={{
                    rotate: isOpen ? 45 : 0,
                    y: isOpen ? 8 : 0,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full h-0.5 bg-current origin-left rounded-full"
            />
            <motion.span
                animate={{
                    opacity: isOpen ? 0 : 1,
                    scaleX: isOpen ? 0 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="w-full h-0.5 bg-current rounded-full"
            />
            <motion.span
                animate={{
                    rotate: isOpen ? -45 : 0,
                    y: isOpen ? -8 : 0,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full h-0.5 bg-current origin-left rounded-full"
            />
        </div>
    );
};

export default AnimatedMenuIcon;

"use client";

import { cn } from "@/lib/utils";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

const DatabaseIcon = forwardRef(
 (
  {
   onMouseEnter,
   onMouseLeave,
   className,
   size = 24,
   duration = 1,
   isAnimated = true,
   ...props
  },
  ref,
 ) => {
  const controls = useAnimation();
  const reduced = useReducedMotion();
  const isControlled = useRef(false);

  useImperativeHandle(ref, () => {
   isControlled.current = true;
   return {
    startAnimation: () =>
     reduced ? controls.start("normal") : controls.start("animate"),
    stopAnimation: () => controls.start("normal"),
   };
  });

  const handleEnter = useCallback(
   (e) => {
    if (!isAnimated || reduced) return;
    if (!isControlled.current) controls.start("animate");
    else onMouseEnter?.(e);
   },
   [controls, reduced, isAnimated, onMouseEnter],
  );

  const handleLeave = useCallback(
   (e) => {
    if (!isControlled.current) controls.start("normal");
    else onMouseLeave?.(e);
   },
   [controls, onMouseLeave],
  );

  const topStackVariants = {
    normal: { y: 0, opacity: 1 },
    animate: { 
        y: [-2, 0],
        opacity: [0.5, 1],
        transition: { duration: 0.5 * duration, repeat: 0, delay: 0 }
    }
  };

  const midStackVariants = {
    normal: { y: 0, opacity: 1 },
    animate: { 
        y: [-2, 0],
        opacity: [0.5, 1],
        transition: { duration: 0.5 * duration, repeat: 0, delay: 0.1 }
    }
  };

  const bottomStackVariants = {
    normal: { y: 0, opacity: 1 },
    animate: { 
        y: [-2, 0],
        opacity: [0.5, 1],
        transition: { duration: 0.5 * duration, repeat: 0, delay: 0.2 }
    }
  };

  return (
   <motion.div
    className={cn("inline-flex items-center justify-center", className)}
    onMouseEnter={handleEnter}
    onMouseLeave={handleLeave}
    {...props}
   >
    <motion.svg
     xmlns="http://www.w3.org/2000/svg"
     width={size}
     height={size}
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     strokeLinecap="round"
     strokeLinejoin="round"
     animate={controls}
     initial="normal"
    >
     <motion.ellipse cx="12" cy="5" rx="9" ry="3" variants={topStackVariants} />
     <motion.path d="M3 5V19A9 3 0 0 0 21 19V5" variants={bottomStackVariants} />
     <motion.path d="M3 12A9 3 0 0 0 21 12" variants={midStackVariants} />
    </motion.svg>
   </motion.div>
  );
 }
);

DatabaseIcon.displayName = "DatabaseIcon";
export { DatabaseIcon };

"use client";

import { cn } from "@/lib/utils";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

// --- PackageIcon (Products) ---
const PackageIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () => reduced ? controls.start("normal") : controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback((e) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) controls.start("animate");
      else onMouseEnter?.(e);
    }, [controls, reduced, isAnimated, onMouseEnter]);

    const handleLeave = useCallback((e) => {
      if (!isControlled.current) controls.start("normal");
      else onMouseLeave?.(e);
    }, [controls, onMouseLeave]);

    const boxVariants = {
      normal: { scale: 1 },
      animate: {
        scale: [1, 1.1, 0.95, 1],
        transition: { duration: 0.5 * duration, ease: "easeInOut" },
      },
    };

    const lidVariants = {
      normal: { y: 0 },
      animate: {
        y: [0, -2, 0],
        transition: { duration: 0.5 * duration, ease: "easeInOut", delay: 0.1 },
      },
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={boxVariants} initial="normal" animate={controls}>
          <path d="M16.5 9.4 7.5 4.21" />
          <motion.path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" variants={lidVariants} />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" x2="12" y1="22.08" y2="12" />
        </motion.svg>
      </motion.div>
    );
  }
);
PackageIcon.displayName = "PackageIcon";

// --- ShoppingBagIcon (Orders) ---
const ShoppingBagIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () => reduced ? controls.start("normal") : controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback((e) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) controls.start("animate");
      else onMouseEnter?.(e);
    }, [controls, reduced, isAnimated, onMouseEnter]);

    const handleLeave = useCallback((e) => {
      if (!isControlled.current) controls.start("normal");
      else onMouseLeave?.(e);
    }, [controls, onMouseLeave]);

    const bagVariants = {
      normal: { y: 0 },
      animate: {
        y: [0, -1, 1, 0],
        transition: { duration: 0.5 * duration, ease: "easeInOut" },
      },
    };

    const handleVariants = {
      normal: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [1, 0.8, 1],
        opacity: [1, 0.8, 1],
        transition: { duration: 0.5 * duration, ease: "easeInOut" },
      },
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={bagVariants} initial="normal" animate={controls}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <motion.path d="M16 10a4 4 0 0 1-8 0" variants={handleVariants} />
        </motion.svg>
      </motion.div>
    );
  }
);
ShoppingBagIcon.displayName = "ShoppingBagIcon";

// --- LayersIcon (Categories) ---
const LayersIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () => reduced ? controls.start("normal") : controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback((e) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) controls.start("animate");
      else onMouseEnter?.(e);
    }, [controls, reduced, isAnimated, onMouseEnter]);

    const handleLeave = useCallback((e) => {
      if (!isControlled.current) controls.start("normal");
      else onMouseLeave?.(e);
    }, [controls, onMouseLeave]);

    const layerVariants = {
      normal: { y: 0, opacity: 1 },
      animate: (i) => ({
        y: [0, -4, 0],
        opacity: [1, 0.5, 1],
        transition: { duration: 0.5 * duration, delay: i * 0.1, ease: "easeInOut" },
      }),
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={controls} initial="normal">
          <motion.path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" variants={layerVariants} custom={2} />
          <motion.path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" variants={layerVariants} custom={0} />
          <motion.path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" variants={layerVariants} custom={1} />
        </motion.svg>
      </motion.div>
    );
  }
);
LayersIcon.displayName = "LayersIcon";

// --- ShieldIcon (Verify) ---
const ShieldIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () => reduced ? controls.start("normal") : controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback((e) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) controls.start("animate");
      else onMouseEnter?.(e);
    }, [controls, reduced, isAnimated, onMouseEnter]);

    const handleLeave = useCallback((e) => {
      if (!isControlled.current) controls.start("normal");
      else onMouseLeave?.(e);
    }, [controls, onMouseLeave]);

    const shieldVariants = {
      normal: { scale: 1 },
      animate: {
        scale: [1, 1.1, 1],
        transition: { duration: 0.5 * duration, ease: "easeInOut" },
      },
    };

    const shimmerVariants = {
      normal: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [0, 1],
        opacity: [0.5, 1],
        transition: { duration: 0.5 * duration, ease: "easeOut" },
      },
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={shieldVariants} initial="normal" animate={controls}>
          <motion.path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" variants={shimmerVariants} />
        </motion.svg>
      </motion.div>
    );
  }
);
ShieldIcon.displayName = "ShieldIcon";

// --- LogOutIcon ---
const LogOutIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () => reduced ? controls.start("normal") : controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback((e) => {
      if (!isAnimated || reduced) return;
      if (!isControlled.current) controls.start("animate");
      else onMouseEnter?.(e);
    }, [controls, reduced, isAnimated, onMouseEnter]);

    const handleLeave = useCallback((e) => {
      if (!isControlled.current) controls.start("normal");
      else onMouseLeave?.(e);
    }, [controls, onMouseLeave]);

    const iconVariants = {
        normal: { x: 0 },
        animate: { 
            x: [0, 2, 0],
            transition: { duration: 0.5 * duration, ease: "easeInOut", repeat: 1 }
        }
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={controls} initial="normal">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <motion.polyline points="16 17 21 12 16 7" variants={iconVariants} />
          <motion.line x1="21" x2="9" y1="12" y2="12" variants={iconVariants} />
        </motion.svg>
      </motion.div>
    );
  }
);
LogOutIcon.displayName = "LogOutIcon";

export { PackageIcon, ShoppingBagIcon, LayersIcon, ShieldIcon, LogOutIcon };

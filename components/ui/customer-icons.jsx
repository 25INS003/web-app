"use client";

import { cn } from "@/lib/utils";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

// --- TruckIcon (Fast Delivery) ---
const TruckIcon = forwardRef(
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

    // Whole icon shakes to simulate movement
    const iconVariants = {
      normal: { x: 0, rotate: 0 },
      animate: {
        x: [0, 2, -1, 2, 0],
        rotate: [0, -1, 1, -0.5, 0],
        transition: { duration: 0.5 * duration, ease: "easeInOut" },
      },
    };

    // Wheels spin
    const wheelVariants = {
      normal: { rotate: 0 },
      animate: {
        rotate: [0, 360],
        transition: { duration: 0.5 * duration, ease: "linear" },
      },
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={iconVariants} initial="normal" animate={controls}>
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18h6a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <motion.circle cx="17" cy="18" r="2" variants={wheelVariants} initial="normal" animate={controls} style={{ transformOrigin: "17px 18px" }} />
          <motion.circle cx="7" cy="18" r="2" variants={wheelVariants} initial="normal" animate={controls} style={{ transformOrigin: "7px 18px" }} />
        </motion.svg>
      </motion.div>
    );
  }
);
TruckIcon.displayName = "TruckIcon";

// --- LeafIcon (Fresh Items) ---
const LeafIcon = forwardRef(
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

    const leafVariants = {
      normal: { scale: 1, rotate: 0 },
      animate: {
        scale: [1, 1.1, 0.95, 1],
        rotate: [0, 5, -5, 0],
        transition: { duration: 0.8 * duration, ease: "easeInOut" },
      },
    };

    const stemVariants = {
      normal: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [0, 1],
        opacity: [0.5, 1],
        transition: { duration: 0.6 * duration, ease: "easeOut" },
      },
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={leafVariants} initial="normal" animate={controls}>
          <motion.path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" variants={leafVariants} />
          <motion.path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" variants={stemVariants} initial="normal" animate={controls} />
        </motion.svg>
      </motion.div>
    );
  }
);
LeafIcon.displayName = "LeafIcon";

// --- RupeeIcon (Low Cost) ---
const RupeeIcon = forwardRef(
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

    // Bounce and scale animation
    const iconVariants = {
      normal: { scale: 1, y: 0 },
      animate: {
        scale: [1, 1.15, 0.95, 1],
        y: [0, -3, 2, 0],
        transition: { duration: 0.6 * duration, ease: "easeInOut" },
      },
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={iconVariants} initial="normal" animate={controls}>
          <path d="M6 3h12" />
          <path d="M6 8h12" />
          <path d="m6 13 8.5 8" />
          <path d="M6 13h3" />
          <path d="M9 13c6.667 0 6.667-10 0-10" />
        </motion.svg>
      </motion.div>
    );
  }
);
RupeeIcon.displayName = "RupeeIcon";

// --- StoreIcon (Support Local Vendors) ---
const StoreIcon = forwardRef(
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

    // Whole icon scales with a bounce
    const iconVariants = {
      normal: { scale: 1 },
      animate: {
        scale: [1, 1.08, 0.96, 1],
        transition: { duration: 0.5 * duration, ease: "easeInOut" },
      },
    };

    // Roof bounces up slightly
    const roofVariants = {
      normal: { y: 0 },
      animate: {
        y: [0, -2, 0],
        transition: { duration: 0.4 * duration, ease: "easeOut" },
      },
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={iconVariants} initial="normal" animate={controls}>
          <motion.path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" variants={roofVariants} initial="normal" animate={controls} />
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
          <path d="M2 7h20" />
          <motion.path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" variants={roofVariants} initial="normal" animate={controls} />
        </motion.svg>
      </motion.div>
    );
  }
);
StoreIcon.displayName = "StoreIcon";

// --- CommunityIcon (Growing Community) ---
const CommunityIcon = forwardRef(
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
      normal: { scale: 1 },
      animate: {
        scale: [1, 1.05, 1],
        transition: { duration: 0.5 * duration, ease: "easeInOut" },
      },
    };

    const personVariants = {
      normal: { y: 0, opacity: 1 },
      animate: (i) => ({
        y: [0, -3, 0],
        opacity: [0.7, 1],
        transition: { duration: 0.5 * duration, ease: "easeOut", delay: i * 0.1 },
      }),
    };

    return (
      <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
        <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={iconVariants} initial="normal" animate={controls}>
          {/* Center person */}
          <motion.path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" variants={personVariants} custom={0} initial="normal" animate={controls} />
          <motion.circle cx="9" cy="7" r="4" variants={personVariants} custom={1} initial="normal" animate={controls} />
          {/* Right person */}
          <motion.path d="M22 21v-2a4 4 0 0 0-3-3.87" variants={personVariants} custom={2} initial="normal" animate={controls} />
          <motion.path d="M16 3.13a4 4 0 0 1 0 7.75" variants={personVariants} custom={3} initial="normal" animate={controls} />
        </motion.svg>
      </motion.div>
    );
  }
);
CommunityIcon.displayName = "CommunityIcon";

export { TruckIcon, LeafIcon, RupeeIcon, StoreIcon, CommunityIcon };

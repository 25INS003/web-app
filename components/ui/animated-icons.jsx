"use client";

import { cn } from "@/lib/utils";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

// --- EyeIcon ---
const EyeIcon = forwardRef(
 ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
  const eyeControls = useAnimation();
  const pupilControls = useAnimation();
  const reduced = useReducedMotion();
  const isControlled = useRef(false);

  useImperativeHandle(ref, () => {
   isControlled.current = true;
   return {
    startAnimation: () => {
     if (reduced) {
      eyeControls.start("open");
      pupilControls.start("center");
     } else {
      eyeControls.start("blink");
      pupilControls.start("scan");
     }
    },
    stopAnimation: () => {
     eyeControls.start("open");
     pupilControls.start("center");
    },
   };
  });

  const handleEnter = useCallback((e) => {
    if (!isAnimated || reduced) return;
    if (!isControlled.current) {
     eyeControls.start("blink");
     pupilControls.start("scan");
    } else {
     onMouseEnter?.(e);
    }
   }, [eyeControls, pupilControls, onMouseEnter, reduced, isAnimated]);

  const handleLeave = useCallback((e) => {
    if (!isControlled.current) {
     eyeControls.start("open");
     pupilControls.start("center");
    } else {
     onMouseLeave?.(e);
    }
   }, [eyeControls, pupilControls, onMouseLeave]);

  const eyeVariants = {
   open: { scaleY: 1 },
   blink: {
    scaleY: [1, 0.1, 1],
    transition: { duration: 0.25 * duration, repeatDelay: 2.4, ease: "easeInOut" },
   },
  };

  const pupilVariants = {
   center: { x: 0 },
   scan: {
    x: [-2, 2, -1, 1, 0],
    transition: { duration: 1.6 * duration, ease: "easeInOut" },
   },
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
     <motion.path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" animate={eyeControls} initial="open" variants={eyeVariants} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
     <motion.circle cx="12" cy="12" r="3" animate={pupilControls} initial="center" variants={pupilVariants} />
    </svg>
   </motion.div>
  );
 }
);
EyeIcon.displayName = "EyeIcon";

// --- EyeOffIcon ---
const EyeOffIcon = forwardRef(
 ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
  const arcControls = useAnimation();
  const slashControls = useAnimation();
  const reduced = useReducedMotion();
  const isControlled = useRef(false);

  useImperativeHandle(ref, () => {
   isControlled.current = true;
   return {
    startAnimation: () => {
     if (reduced) {
      arcControls.start("visible");
      slashControls.start("visible");
     } else {
      arcControls.start("hide");
      slashControls.start("strike");
     }
    },
    stopAnimation: () => {
     arcControls.start("visible");
     slashControls.start("visible");
    },
   };
  });

  const handleEnter = useCallback((e) => {
    if (!isAnimated || reduced) return;
    if (!isControlled.current) {
     arcControls.start("hide");
     slashControls.start("strike");
    } else onMouseEnter?.(e);
   }, [arcControls, slashControls, isAnimated, reduced, onMouseEnter]);

  const handleLeave = useCallback((e) => {
    if (!isControlled.current) {
     arcControls.start("visible");
     slashControls.start("visible");
    } else onMouseLeave?.(e);
   }, [arcControls, slashControls, onMouseLeave]);

  const arcVariants = {
   visible: { opacity: 1, scale: 1 },
   hide: { opacity: 0.4, scale: 0.92, transition: { duration: 0.25 * duration, ease: "easeOut" } },
  };

  const slashVariants = {
   visible: { pathLength: 1, opacity: 1 },
   hidden: { pathLength: 0, opacity: 0 },
   strike: { pathLength: [0, 1], opacity: [0.6, 1], transition: { duration: 0.35 * duration, ease: "easeOut" } },
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <motion.g animate={arcControls} initial="visible" variants={arcVariants} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
     </motion.g>
     <motion.path d="m2 2 20 20" animate={slashControls} initial={props.slashInitial || "visible"} variants={slashVariants} />
    </svg>
   </motion.div>
  );
 }
);
EyeOffIcon.displayName = "EyeOffIcon";

// --- LockIcon ---
const LockIcon = forwardRef(
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

  const lockVariants = {
   normal: { x: 0, rotate: 0 },
   animate: {
    x: [0, -3, 3, -3, 3, 0],
    rotate: [0, -2, 2, -2, 2, 0],
    transition: { duration: 0.4 * duration },
   },
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
    <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={lockVariants} animate={controls} initial="normal">
     <motion.rect width="18" height="11" x="3" y="11" rx="2" ry="2" initial="normal" animate={controls} />
     <motion.path d="M7 11V7a5 5 0 0 1 10 0v4" initial="normal" animate={controls} />
    </motion.svg>
   </motion.div>
  );
 }
);
LockIcon.displayName = "LockIcon";

// --- MailIcon ---
const MailIcon = forwardRef(
 ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
  const flapControls = useAnimation();
  const bodyControls = useAnimation();
  const containerControls = useAnimation();
  const reduced = useReducedMotion();
  const isControlled = useRef(false);

  useImperativeHandle(ref, () => {
   isControlled.current = true;
   return {
    startAnimation: () => {
     if (reduced) {
      containerControls.start("normal");
      flapControls.start("normal");
      bodyControls.start("normal");
     } else {
      containerControls.start("animate");
      flapControls.start("animate");
      bodyControls.start("animate");
     }
    },
    stopAnimation: () => {
     containerControls.start("normal");
     flapControls.start("normal");
     bodyControls.start("normal");
    },
   };
  });

  const handleEnter = useCallback((e) => {
    if (!isAnimated || reduced) return;
    if (!isControlled.current) {
     containerControls.start("animate");
     flapControls.start("animate");
     bodyControls.start("animate");
    } else onMouseEnter?.(e);
   }, [containerControls, flapControls, bodyControls, reduced, onMouseEnter, isAnimated]);

  const handleLeave = useCallback((e) => {
    if (!isControlled.current) {
     containerControls.start("normal");
     flapControls.start("normal");
     bodyControls.start("normal");
    } else onMouseLeave?.(e);
   }, [containerControls, flapControls, bodyControls, onMouseLeave]);

  const containerVariants = {
   normal: { scale: 1 },
   animate: { scale: [1, 1.04, 1], transition: { duration: 0.36 * duration, ease: "easeOut" } },
  };

  const flapVariants = {
   normal: { rotateX: 0, translateY: 0, transformOrigin: "12px 6px" },
   animate: {
    rotateX: [-0, -12, 2, 0],
    translateY: [0, -1.6, 0.6, 0],
    transition: { duration: 0.45 * duration, ease: "easeOut", times: [0, 0.5, 0.85, 1] },
   },
  };

  const bodyVariants = {
   normal: { opacity: 1 },
   animate: { opacity: [1, 0.95, 1], transition: { duration: 0.45 * duration, ease: "easeOut" } },
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props} initial="normal" animate={containerControls} variants={containerVariants}>
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <motion.path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" initial="normal" animate={flapControls} variants={flapVariants} style={{ transformStyle: "preserve-3d" }} />
     <motion.rect x="2" y="4" width="20" height="16" rx="2" initial="normal" animate={bodyControls} variants={bodyVariants} />
    </svg>
   </motion.div>
  );
 }
);
MailIcon.displayName = "MailIcon";

// --- UserIcon ---
const UserIcon = forwardRef(
 ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, isAnimated = true, ...props }, ref) => {
  const controls = useAnimation();
  const reduced = useReducedMotion();
  const isControlled = useRef(false);

  useImperativeHandle(ref, () => {
   isControlled.current = true;
   return {
    startAnimation: () => controls.start("animate"),
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

  const bodyVariants = {
   normal: { strokeDashoffset: 0, opacity: 1 },
   animate: { strokeDashoffset: [40, 0], opacity: [0.3, 1], transition: { duration: 0.6 * duration, ease: "easeInOut" } },
  };

  const headVariants = {
   normal: { scale: 1, opacity: 1 },
   animate: { scale: [0.6, 1.2, 1], opacity: [0, 1], transition: { duration: 0.5 * duration, ease: "easeOut", delay: 0.2 } },
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
    <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <motion.path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" strokeDasharray="40" strokeDashoffset="0" variants={bodyVariants} initial="normal" animate={controls} />
     <motion.circle cx="12" cy="7" r="4" variants={headVariants} initial="normal" animate={controls} />
    </motion.svg>
   </motion.div>
  );
 }
);
UserIcon.displayName = "UserIcon";

// --- PhoneIcon ---
const PhoneIcon = forwardRef(
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

  const phoneVariants = {
   normal: { rotate: 0 },
   animate: { rotate: [0, -8, 8, -6, 6, 0], transition: { duration: 0.9 * duration, ease: "easeInOut" } },
  };

  const pulseVariants = {
   normal: { opacity: 0, scale: 1 },
   animate: { opacity: [0, 0.3, 0], scale: [1, 1.8, 2], transition: { duration: 0.9 * duration, ease: "easeOut" } },
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
    <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     {/* Phone path first so it renders correctly on initial load */}
     <motion.path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" variants={phoneVariants} initial="normal" animate={controls} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
     {/* Pulse circle on top - starts invisible */}
     <motion.circle cx="12" cy="12" r="8" fill="none" strokeWidth="1" variants={pulseVariants} initial="normal" animate={controls} />
    </motion.svg>
   </motion.div>
  );
 }
);
PhoneIcon.displayName = "PhoneIcon";

// --- CheckIcon ---
const CheckIcon = forwardRef(
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

  const tickVariants = {
   normal: { strokeDashoffset: 0, scale: 1, opacity: 1 },
   animate: { strokeDashoffset: [20, 0], scale: [1, 1.2, 1], opacity: [0.5, 1], transition: { duration: 0.6 * duration, ease: "easeInOut" } },
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
    <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <motion.path d="M5 13l4 4L19 7" strokeDasharray="20" strokeDashoffset="0" variants={tickVariants} initial="normal" animate={controls} />
    </motion.svg>
   </motion.div>
  );
 }
);
CheckIcon.displayName = "CheckIcon";

// --- SparklesIcon ---
const SparklesIcon = forwardRef(
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
   
  const sparkleVariants = {
   normal: { opacity: 1, scale: 1, rotate: 0 },
   animate: { opacity: [1, 0.5, 1], scale: [1, 1.2, 1], rotate: [0, 15, -15, 0], transition: { duration: 0.8 * duration, ease: "easeInOut", repeat: 1 } }
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
     <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" variants={sparkleVariants} initial="normal" animate={controls} />
      <motion.path d="M20 3v4" variants={sparkleVariants} initial="normal" animate={controls} transition={{ delay: 0.1 }} />
      <motion.path d="M22 5h-4" variants={sparkleVariants} initial="normal" animate={controls} transition={{ delay: 0.1 }} />
      <motion.path d="M4 17v2" variants={sparkleVariants} initial="normal" animate={controls} transition={{ delay: 0.2 }} />
      <motion.path d="M5 18H3" variants={sparkleVariants} initial="normal" animate={controls} transition={{ delay: 0.2 }} />
     </svg>
   </motion.div>
  );
 }
);
SparklesIcon.displayName = "SparklesIcon";

// --- GithubIcon ---
const GithubIcon = forwardRef(
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

  const svgVariants = {
   normal: {
    scale: 1,
    transition: { duration: 0.3 * duration },
   },
   animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 1 * duration },
   },
  };

  const bodyVariants = {
   normal: {
    pathLength: 1,
    pathOffset: 0,
    opacity: 1,
    transition: { duration: 0.3 * duration },
   },
   animate: {
    pathLength: [1, 0.6, 1],
    pathOffset: [0, 0.4, 0],
    opacity: [1, 0.7, 1],
    transition: { duration: 1 * duration },
   },
  };

  const handVariants = {
   normal: { rotate: 0, originX: 0.9, originY: 0.5 },
   animate: {
    rotate: [0, 20, -15, 0],
    originX: 0.9,
    originY: 0.5,
    transition: { duration: 1 * duration, repeat: Infinity },
   },
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
    <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={svgVariants} initial="normal" animate={controls}>
     <motion.path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36 1.5-8 1.5C9.64 5 6.5 3 4.5 3.5c-.28 1.15-.28 2.35 0 3.5A5.403 5.403 0 0 0 3.5 10.5c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" variants={bodyVariants} initial="normal" />
     <motion.path d="M9 18c-4.51 2-5-2-7-2" variants={handVariants} initial="normal" animate={controls} />
    </motion.svg>
   </motion.div>
  );
 }
);
GithubIcon.displayName = "GithubIcon";

// --- InstagramIcon ---
const InstagramIcon = forwardRef(
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
   normal: { scale: 1, rotate: 0 },
   animate: { scale: [1, 1.06, 1], rotate: 0, transition: { duration: 0.4 * duration, ease: "easeOut" } },
  };

  const frameVariants = {
   normal: { pathLength: 1, opacity: 1 },
   animate: { pathLength: [0.2, 1], opacity: [0.6, 1], transition: { duration: 0.55 * duration, ease: "easeInOut" } },
  };

  const lensVariants = {
   normal: { scale: 1, pathLength: 1 },
   animate: { scale: [0.85, 1.05, 1], pathLength: [0, 1], transition: { duration: 0.5 * duration, delay: 0.1 * duration, ease: "easeOut" } },
  };

  const dotVariants = {
   normal: { scale: 1, opacity: 1 },
   animate: { scale: [1, 1.5, 1], opacity: [1, 0.4, 1], transition: { duration: 0.35 * duration, delay: 0.2 * duration, ease: "easeInOut" } },
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
    <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={controls} initial="normal" variants={iconVariants}>
     <motion.rect width="20" height="20" x="2" y="2" rx="5" ry="5" variants={frameVariants} />
     <motion.path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" variants={lensVariants} />
     <motion.line x1="17.5" x2="17.51" y1="6.5" y2="6.5" variants={dotVariants} />
    </motion.svg>
   </motion.div>
  );
 }
);
InstagramIcon.displayName = "InstagramIcon";

// --- TwitterIcon ---
const TwitterIcon = forwardRef(
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

  const svgVariants = {
   normal: { y: 0, scale: 1, rotate: 0 },
   animate: {
    y: [0, -4, 0, -2, 0],
    scale: [1, 1.08, 0.95, 1],
    rotate: [0, -2, 2, 0],
    transition: { duration: 1.2 * duration, ease: "easeInOut" },
   },
  };

  const pathVariants = {
   normal: { opacity: 1, scale: 1 },
   animate: {
    opacity: [0.9, 1, 1],
    scale: [1, 1.12, 1],
    transition: { duration: 0.8 * duration, ease: "easeOut", delay: 0.15 },
   },
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
    <motion.svg xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="currentColor" viewBox="0 0 512 512" height={size} width={size} animate={controls} initial="normal" variants={svgVariants}>
     <motion.path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" variants={pathVariants} initial="normal" animate={controls} />
    </motion.svg>
   </motion.div>
  );
 }
);
TwitterIcon.displayName = "TwitterIcon";

// --- DashboardIcon ---
const DashboardIcon = forwardRef(
 ({ onMouseEnter, onMouseLeave, className, size = 24, duration = 0.6, isAnimated = true, ...props }, ref) => {
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
   normal: { scale: 1, rotate: 0 },
   animate: {
    scale: [1, 1.06, 0.98, 1],
    rotate: [0, -1.5, 1.5, 0],
    transition: { duration: 1.1 * duration, ease: "easeInOut" },
   },
  };

  const tileVariants = {
   normal: { opacity: 1, scale: 1, y: 0 },
   animate: (i) => ({
    opacity: [0.6, 1],
    scale: [0.95, 1.04, 1],
    y: [3, -2, 0],
    transition: {
     duration: 0.9 * duration,
     ease: "easeInOut",
     delay: i * 0.08,
    },
   }),
  };

  return (
   <motion.div className={cn("inline-flex items-center justify-center", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
    <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={controls} initial="normal" variants={iconVariants}>
     <motion.rect width="7" height="9" x="3" y="3" rx="1" variants={tileVariants} custom={0} initial="normal" animate={controls} />
     <motion.rect width="7" height="5" x="14" y="3" rx="1" variants={tileVariants} custom={1} initial="normal" animate={controls} />
     <motion.rect width="7" height="9" x="14" y="12" rx="1" variants={tileVariants} custom={2} initial="normal" animate={controls} />
     <motion.rect width="7" height="5" x="3" y="16" rx="1" variants={tileVariants} custom={3} initial="normal" animate={controls} />
    </motion.svg>
   </motion.div>
  );
 }
);
DashboardIcon.displayName = "DashboardIcon";

export { EyeIcon, EyeOffIcon, LockIcon, MailIcon, UserIcon, PhoneIcon, CheckIcon, SparklesIcon, GithubIcon, InstagramIcon, TwitterIcon, DashboardIcon };

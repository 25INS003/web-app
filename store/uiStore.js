// src/store/uiStore.ts
"use client";

import { create } from "zustand";


export const useUIStore = create((set, get) => ({
  // Initial state
  isSidebarOpen: true, // Default state
  theme: "light",
  isMobile: false,
  scrollY: 0,
  isTop: true,

  // Actions

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  closeSidebar: () => set({ isSidebarOpen: false }),

  setTheme: (theme) => set({ theme }),

  setIsMobile: (isMobile) => set({ isMobile }),

  setScrollState: (scrollY, isTop) => 
    set({ 
      scrollY, 
      isTop: isTop !== undefined ? isTop : scrollY <= 50 
    }),

  initializeUI: () => {
    // Initialize mobile detection
    const checkIsMobile = () => {
      const isMobile = window.innerWidth < 580;
      get().setIsMobile(isMobile);
    };

    // Initialize scroll detection
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const isTop = scrollY <= 50;
      get().setScrollState(scrollY, isTop);
    };

    // Set initial values
    checkIsMobile();
    handleScroll();

    // Add event listeners
    window.addEventListener("resize", checkIsMobile);
    window.addEventListener("scroll", handleScroll);

    // Return cleanup function
    return () => {
      window.removeEventListener("resize", checkIsMobile);
      window.removeEventListener("scroll", handleScroll);
    };
  },
}));

// Custom hooks for specific state slices
export const useSidebar = () => {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  return { isSidebarOpen, toggleSidebar };
};

export const useTheme = () => {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  return { theme, setTheme };
};

export const useIsMobile = () => {
  const isMobile = useUIStore((state) => state.isMobile);
  const setIsMobile = useUIStore((state) => state.setIsMobile);
  return { isMobile, setIsMobile };
};

export const useScroll = () => {
  const scrollY = useUIStore((state) => state.scrollY);
  const isTop = useUIStore((state) => state.isTop);
  const setScrollState = useUIStore((state) => state.setScrollState);
  return { scrollY, isTop, setScrollState };
};

// Provider component for easy integration
import { useEffect } from "react";


export const UIProvider = ({ children, topThreshold = 50 }) => {
  const initializeUI = useUIStore((state) => state.initializeUI);

  useEffect(() => {
    const cleanup = initializeUI();
    return cleanup;
  }, [initializeUI]);

  return <>{children}</>;
};

// Usage examples:

/*
// Example 1: Using individual hooks
import { useSidebar, useTheme, useIsMobile, useScroll } from "@/store/uiStore";

const MyComponent = () => {
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { isMobile } = useIsMobile();
  const { scrollY, isTop } = useScroll();

  return (
    <div>
      <p>Sidebar: {sidebarOpen ? "Open" : "Closed"}</p>
      <p>Theme: {theme}</p>
      <p>Device: {isMobile ? "Mobile" : "Desktop"}</p>
      <p>Scroll Position: {scrollY}px</p>
      <p>At top: {isTop ? "Yes" : "No"}</p>
    </div>
  );
};

// Example 2: Using the full store
import { useUIStore } from "@/store/uiStore";

const AnotherComponent = () => {
  const { 
    sidebarOpen, 
    theme, 
    isMobile, 
    scrollY, 
    toggleSidebar,
    setTheme 
  } = useUIStore();

  return (
    <div>
      {/* Your component logic * /}
    </div>
  );
};

// Example 3: In your app layout
import { UIProvider } from "@/store/uiStore";

export default function RootLayout({ children }) {
  return (
    <UIProvider topThreshold={100}>
      {children}
    </UIProvider>
  );
}
*/
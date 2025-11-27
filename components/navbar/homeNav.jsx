// Header.tsx
'use client';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile, useScroll } from "@/store/uiStore";
import Image from "next/image";


const Header = () => {
    const { isMobile } = useIsMobile();
    const { isTop } = useScroll();
    const [showNav, setShowNav] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // const { logout, user, isAuthenticated } = useAuth();
    // Use a local effect to track scroll direction for hiding/showing the header,
    // but only when the mobile menu is NOT open.
    useEffect(() => {
        const handleScrollDirection = () => {
            const currentScroll = window.scrollY; // Use window.scrollY here for direction tracking

            // Only hide/show header based on scroll direction if the mobile menu is NOT open.
            // When the menu is open, the header should stay visible to show the close button.
            if (!isMenuOpen) {
                if (currentScroll > lastScrollY) {
                    // scrolling down → hide
                    setShowNav(false);
                } else {
                    // scrolling up → show
                    setShowNav(true);
                }
            }
            setLastScrollY(currentScroll);
        };

        window.addEventListener("scroll", handleScrollDirection);
        return () => window.removeEventListener("scroll", handleScrollDirection);
    }, [lastScrollY, isMenuOpen]); // Added isMenuOpen as dependency

    // Close mobile menu when switching to desktop
    useEffect(() => {
        if (!isMobile) {
            setIsMenuOpen(false);
        }
    }, [isMobile]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = ''; // Clean up on unmount
        };
    }, [isMenuOpen]);

    const handleLinkClick = () => {
        if (isMobile) {
            setIsMenuOpen(false); // Close menu on link click in mobile
        }
    };

    // --- Header Dynamic Styles ---
    // Mobile: Normal Logo, transparent at top, black when scrolled
    // Desktop: Big Logo at top, smaller black when scrolled
    const headerHeight = isTop && !isMobile ? 100 : 50; // Desktop: Big/Small. Mobile: Always small (60)
    const logoText = isTop && !isMobile ? (
        <Image src={"/log.png"} width={70} height={70} alt="logo" style={{ height: 'auto' }} />
    ) : (
        <Image src={"/log.png"} width={50} height={50} alt="logo" style={{ height: 'auto' }} />
    ); // Desktop: Big/Small. Mobile: Always "Logo"

    const headerBackgroundColor = (isTop && !isMenuOpen) ? "rgba(0,0,0,0)" : "var(--background)";
    // When mobile menu is open, override the header background to be darker/solid
    const finalBackgroundColor = isMobile && isMenuOpen ? "var(--background)" : headerBackgroundColor;

    return (
        <motion.header
            initial={{ y: 0 }}
            animate={{
                    y: showNav || isMenuOpen ? 0 : -100, // Always show if menu is open
                    height: isMobile && isMenuOpen ? '100vh' : headerHeight, // Full screen on mobile when menu open, otherwise dynamic (desktop) or fixed small (mobile)
                    opacity: isTop ?1 : 0.8
                }}
                // Use a regular style for backgroundColor so framer-motion won't attempt to animate lab() CSS values
                style={{ backgroundColor: finalBackgroundColor }}
            transition={{ duration: 0.3 }}
            className={`fixed top-0 left-0 w-full z-50 flex items-center px-6 ${isMobile && isMenuOpen ? 'flex-col justify-start items-center' : ''}`}
        >
            {/* Logo and Mobile Menu Button Container (to keep them on one line) */}
            <div className={`flex w-full items-center ${isMobile && isMenuOpen ? 'pt-6 pb-4' : ''}`}>
                {/* Logo */}
                <div className="text-white font-bold text-2xl flex-1 z-50">
                    {isMobile && isMenuOpen ? "Logo" : logoText} {/* Mobile menu open: just "Logo" */}
                </div>

                {/* Mobile Menu Icon */}
                {isMobile && (
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-white text-3xl relative z-50 p-2"
                    >
                        {isMenuOpen ? "✕" : "☰"}
                    </button>
                )}
            </div>

            {/* Navigation Links (Desktop) */}
            {!isMobile && (
                <nav className="flex space-x-6 text-foreground items-center justify-center text-foreground">
                    <a href="/" className="hover:text-gray-300">Home</a>
                    <a href="/papers" className="hover:text-gray-300">Papers</a>
                    <a href="/upload" className="hover:text-gray-300">Upload</a>
                    
                    <a href="/contact" className="hover:text-gray-300">Contact</a>
                    
                    
                    {/* {(user?.is_superuser || user?.is_staff) && <a href="/pages/admin" className="hover:text-gray-300">Admin</a>}
                    {isAuthenticated && <button onClick={logout} className="hover:text-gray-300">Logout</button>} */}
                </nav>
            )}

            {/* Mobile Navigation Links */}
            <AnimatePresence>
                {isMobile && isMenuOpen && (
                    <motion.nav
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex flex-col items-center justify-center space-y-8 text-white text-3xl w-full   flex-grow p-4"
                    >
                        <a href="/" onClick={handleLinkClick} className="hover:text-gray-300 text-foreground">Home</a>
                        <a href="/papers" onClick={handleLinkClick} className="hover:text-gray-300 text-foreground">Paper</a>
                        <a href="/upload" onClick={handleLinkClick} className="hover:text-gray-300 text-foreground">Upload</a>

                        <a href="/contact" onClick={handleLinkClick} className="hover:text-gray-300 text-foreground">Contact</a>
                        <div><ThemeToggle/></div>
                        {/* {(user?.is_superuser || user?.is_staff) && <a href="/pages/admin" className="hover:text-gray-300">Admin</a>} */}

                        {/* <button onClick={() => { handleLinkClick(); logout(); }} className="hover:text-gray-300">Logout</button> */}
                    </motion.nav>
                )}
            </AnimatePresence>
        </motion.header>
    );
};

export default Header;
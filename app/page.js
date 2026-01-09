"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Reviews from "@/components/landing/Reviews";
import Features from "@/components/landing/Features";
import Integrations from "@/components/landing/Integrations";
import FAQ from "@/components/landing/FAQ";
import { CTA, Footer } from "@/components/landing/Footer";

export default function HomePage() {
    return (
        <main className="min-h-screen w-full flex flex-col font-sans">
            <Navbar />
            <Hero />
            <Reviews />
            <Features />
            <Integrations />
            <FAQ />
            <CTA />
            <Footer />
        </main>
    );
}
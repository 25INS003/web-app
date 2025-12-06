// app/page.tsx
"use client";

import Link from "next/link";
import { FiBox, FiUploadCloud, FiCheckCircle, FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Header from "@/components/navbar/HomeHeader";
import Footer from "@/components/footer";
import { useAuthStore } from "@/store/authStore";
// Hero section tailored for an admin / shopkeeper portal
const HeroSection = () => (
    <section className="text-center max-w-4xl mx-auto py-16 px-4">
        <Badge variant="secondary" className="mb-6 text-sm font-semibold">
            Portal Access • Secure Login
        </Badge>

        <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-6 tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Provider Portal
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Welcome to the Provider administration portal. This interface is for store
            owners and site administrators to manage products, inventory, orders, and reports.
            Not intended for consumer shopping.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg" className="gap-2 text-lg px-8 py-6 rounded-full">
                <Link href="/page/dashboard">
                    Go to Dashboard <FiArrowRight className="ml-1" />
                </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 text-lg px-8 py-6 rounded-full">
                <Link href="/login">
                    Sign in / Switch Account
                </Link>
            </Button>
        </div>
    </section>
);

// Stats section with admin-relevant metrics
const StatsSection = () => (
    <section className="w-full py-12 bg-muted/30">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
            <div className="text-center">
                <h3 className="text-4xl font-bold text-primary">1.5k</h3>
                <p className="text-muted-foreground mt-2">Total Orders</p>
            </div>
            <div className="text-center">
                <h3 className="text-4xl font-bold text-primary">320</h3>
                <p className="text-muted-foreground mt-2">Active Shopkeepers</p>
            </div>
            <div className="text-center">
                <h3 className="text-4xl font-bold text-primary">4.8k</h3>
                <p className="text-muted-foreground mt-2">Products Managed</p>
            </div>
        </div>
    </section>
);

// Feature card using shadcn Card component
const FeatureCard = ({ icon, title, children }) => (
    <Card className="h-full transition-all duration-300 hover:shadow-lg border-0 shadow-md">
        <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10 text-primary text-xl">
                    {icon}
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <CardDescription className="text-base">{children}</CardDescription>
        </CardContent>
    </Card>
);

// Features section focused on admin/shopkeeper needs
const FeaturesSection = () => (
    <section className="w-full py-5 container mx-auto max-w-6xl">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Portal Tools</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                Tools to help you manage orders, inventory and shop performance.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 px-4">
            <FeatureCard icon={<FiBox />} title="Order Management">
                View, process, and track customer orders across stores with bulk actions and filters.
            </FeatureCard>
            <FeatureCard icon={<FiUploadCloud />} title="Inventory Control">
                Manage stock levels, batch updates, and supplier uploads to keep listings in sync.
            </FeatureCard>
            <FeatureCard icon={<FiCheckCircle />} title="Reports & Analytics">
                Get sales reports, shop performance metrics, and exportable data for accounting.
            </FeatureCard>
        </div>
    </section>
);

// CTA section for portal sign-in
const CTASection = () => {
    const { isAuthenticated, user } = useAuthStore();

    return (
        <section className="w-full py-16 bg-primary/5">
            <div className="container mx-auto text-center max-w-3xl">
                <h2 className="text-3xl font-bold mb-4">Access your portal</h2>
                {!isAuthenticated ? (
                    <>
                        <p className="text-muted-foreground mb-8 text-lg">Sign in to manage your shop or view admin controls.</p>
                        <div className="flex items-center justify-center gap-4">
                            <Button asChild size="lg" className="rounded-full px-8 py-6 text-lg">
                                <Link href="/login">Sign in</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-full px-8 py-6 text-lg">
                                <Link href="/request-access">Request Access</Link>
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-muted-foreground mb-6 text-lg">Signed in as <strong>{user?.name || user?.email || 'Account'}</strong></p>
                        <div className="flex items-center justify-center gap-4">
                            <Button asChild size="lg" className="rounded-full px-8 py-6 text-lg">
                                <Link href="/page/dashboard">Open Dashboard</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-full px-8 py-6 text-lg">
                                <Link href="/logout">Sign out</Link>
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default function HomePage() {
    return (
        <>
            <Header />
            <main className="min-h-screen  w-full flex flex-col ziz_HOME">
                {/* Hero Section */}
                <div className="absolute inset-0 -z-10">
                    <Image
                        src="/homebk.jpg"
                        alt="Background"
                        fill // makes it cover the parent container
                        className="object-cover"
                        priority // optional, loads immediately
                    />

                    {/* Overlay with blur */}
                    <div className="absolute inset-0 bg-primary-foreground/70 backdrop-blur-sm"></div>
                </div>
                <div className="flex-1 flex items-center justify-center py-12">
                    <HeroSection />
                </div>

                <div className="w-[98%] max-w-10xl mx-auto mb-16 bg-background/90 rounded-xl shadow-lg">
                    {/* Stats Section */}
                    {/* <StatsSection /> */}

                    {/* Features Section */}
                    <FeaturesSection />

                    {/* CTA Section */}
                    <CTASection />
                </div>




            </main>
            <Footer />
        </>

    );
}
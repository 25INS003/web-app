"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Shield, Store, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VerifyPage = () => {
    const router = useRouter();

    const verificationOptions = [
        {
            title: "Owner Verification",
            description: "Verify shop owners who have registered on the platform",
            icon: Users,
            color: "blue",
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
            borderColor: "border-blue-200",
            hoverBg: "hover:bg-blue-100",
            route: "/verify/owners"
        },
        {
            title: "Shops Verification",
            description: "Verify shops registered by owners on the platform",
            icon: Store,
            color: "green",
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
            borderColor: "border-green-200",
            hoverBg: "hover:bg-green-100",
            route: "/verify/shops"
        }
    ];

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Shield className="h-8 w-8" />
                    Verification Center
                </h1>
                <p className="text-muted-foreground">
                    Manage and verify owners and shops on the platform
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mt-12">
                {verificationOptions.map((option, index) => (
                    <Card 
                        key={index} 
                        className={`bg-white dark:bg-slate-800/60 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${option.borderColor}`}
                        onClick={() => router.push(option.route)}
                    >
                        <CardHeader className="pb-4">
                            <div className={`w-16 h-16 ${option.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                                <option.icon className={`h-8 w-8 ${option.iconColor}`} />
                            </div>
                            <CardTitle className="text-2xl">{option.title}</CardTitle>
                            <CardDescription className="text-base mt-2">
                                {option.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                className="w-full"
                                size="lg"
                                onClick={() => router.push(option.route)}
                            >
                                Go to {option.title}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default VerifyPage;
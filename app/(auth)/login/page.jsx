"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";


export default function LoginPage() {
    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    // const [rememberMe, setRememberMe] = useState(false);
    const [clientReady, setClientReady] = useState(false);

    const router = useRouter();
    const { login, loading, error, isAuthenticated, initializeAuth, clearError } = useAuthStore();

    const handleInitializeAuth = useCallback(initializeAuth, []);
    const handleLogin = useCallback(login, [login]);
    const navigateToDashboard = useCallback(() => router.push("/dashboard"), [router]);

    // Initialize auth state on component mount
    useEffect(() => {
        handleInitializeAuth().finally(() => {
            setClientReady(true);
        });
    }, [handleInitializeAuth]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && clientReady) {
            navigateToDashboard();
        }
    }, [isAuthenticated, clientReady, navigateToDashboard]);

    // Clear error when credentials change
    useEffect(() => {
        if (error) {
            clearError();
        }
    }, [credentials.email, credentials.password]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!credentials.email || !credentials.password) {
            toast.error("Please fill in all fields", {
                description: "Email and password are required to sign in.",
            });
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
            toast.error("Invalid email format", {
                description: "Please enter a valid email address.",
            });
            return;
        }

        const result = await handleLogin(credentials);

        if (result.success) {
            toast.success("Welcome back!", {
                description: "You have been successfully signed in.",
            });

            // if (rememberMe) {
            //     toast.info("Remember me enabled", {
            //         description: "Your session will be remembered on this device.",
            //     });
            // }

            navigateToDashboard();
        } else {
            toast.error("Sign in failed", {
                description: error || "Please check your credentials and try again.",
            });
        }
    };



    // Render guard
    if (!clientReady || isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="flex flex-col items-center space-y-4">
                    <Spinner />
                    <p className="text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-foreground/80 backdrop-blur-m sm:px-6 lg:px-8">
            <Image
                src="/loginBk.png"
                alt="Background"
                fill // makes it cover the parent container
                className="object-cover -z-1"

                priority // optional, loads immediately
            />
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="mt-4 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Provider Portal
                    </h1>
                </div>

                <Card className="shadow-xl border-0">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">
                            Sign in
                        </CardTitle>
                        <CardDescription className="text-center">
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={credentials.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    disabled={loading}
                                    className="h-11"
                                />
                            </div>


                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        value={credentials.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        disabled={loading}
                                        className="h-11 pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-500" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-500" />
                                        )}
                                        <span className="sr-only">
                                            {showPassword ? "Hide password" : "Show password"}
                                        </span>
                                    </Button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                {/* <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onCheckedChange={(checked) => setRememberMe(checked)}
                                        disabled={loading}
                                    />
                                    <Label
                                        htmlFor="rememberMe"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Remember me
                                    </Label>
                                </div> */}
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-blue-600 hover:text-blue-500 hover:underline transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading || !credentials.email || !credentials.password}
                                className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Spinner className="mr-2" size={16} />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign in"
                                )}
                            </Button>
                        </form>

                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <div className="text-center">
                            <Link
                                href="/contact"
                                className="text-xs text-gray-500 hover:text-gray-700 hover:underline transition-colors"
                            >
                                Need help? Contact support
                            </Link>
                        </div>
                    </CardFooter>
                </Card>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-2">
                        <AlertCircle className="h-3 w-3" />
                        Your security is our priority. We use industry-standard encryption.
                    </div>
                </div>
            </div>
        </div>
    );
}
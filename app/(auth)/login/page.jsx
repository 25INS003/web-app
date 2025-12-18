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
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [clientReady, setClientReady] = useState(false);

    const router = useRouter();
    
    const { login, socialLogin, loading, error, isAuthenticated, initializeAuth, clearError } = useAuthStore();

    // Initialize auth state on component mount
    useEffect(() => {
        const init = async () => {
            await initializeAuth();
            setClientReady(true);
        };
        init();
    }, [initializeAuth]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && clientReady) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, clientReady, router]);

    // Clear store errors when user starts typing again
    const handleChange = (e) => {
        if (error) clearError();
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!credentials.email || !credentials.password) {
            toast.error("Required fields missing", { description: "Please enter both email and password." });
            return;
        }

        const result = await login(credentials);

        if (result.success) {
            toast.success("Welcome back!", { description: "Redirecting to dashboard..." });
            router.push("/dashboard");
        } else {
            // result.error contains the msg from err.response.data.message
            toast.error("Sign in failed", { description: result.error || "Invalid credentials." });
        }
    };

    const handleSocialLogin = async (provider) => {
        const result = await socialLogin(provider);
        if (result.success) {
            toast.success(`Signed in with ${provider}`);
            router.push("/dashboard");
        } else {
            toast.error(`${provider} login failed`);
        }
    };

    
    // Prevent hydration flicker or showing login form to auth'd users
    if (!clientReady || isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center space-y-4">
                    <Spinner size={32} className="text-blue-600" />
                    <p className="text-sm text-gray-500 animate-pulse">Verifying session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-foreground/80 relative overflow-hidden sm:px-6 lg:px-8">
            <Image
                src="/loginBk.png"
                alt="Background"
                fill
                className="object-cover -z-10 brightness-95"
                priority
            />

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                        Provider Portal
                    </h1>
                </div>

                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
                        <CardDescription className="text-center">
                            Access your account dashboard
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    required
                                    value={credentials.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="h-11 focus-visible:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-gray-500" /> Password
                                    </span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={credentials.password}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="h-11 pr-10 focus-visible:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 transition-all shadow-md"
                            >
                                {loading ? <Spinner className="mr-2" size={16} /> : "Sign in"}
                            </Button>
                        </form>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-400 font-medium">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" onClick={() => handleSocialLogin()} disabled={loading} className="h-10">
                                Google
                            </Button>
                            <Button variant="outline" onClick={() => handleSocialLogin('facebook')} disabled={loading} className="h-10">
                                Facebook
                            </Button>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col border-t p-6 bg-gray-50/50">
                        <p className="text-sm text-center text-gray-600">
                            Don't have an account?{" "}
                            <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                                Create account
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/80 px-4 py-2 rounded-full border shadow-sm">
                        <AlertCircle className="h-3 w-3" />
                        Encrypted Secure Connection
                    </div>
                </div>
            </div>
        </div>
    );
}
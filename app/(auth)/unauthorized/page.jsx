'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Home, LogIn, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 transition-colors duration-300">
            <Card className="w-full max-w-md shadow-2xl border-0 dark:border dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-amber-100 dark:bg-amber-900/20 p-4 ring-1 ring-amber-500/20">
                            <ShieldAlert className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Access Denied
                        </CardTitle>
                        <CardDescription className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            Unauthorized Access
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="text-center space-y-6 pt-4">
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        You don&apos;t have permission to access this page. This area requires special privileges.
                    </p>
                    
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 text-sm text-left shadow-sm">
                        <p className="font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Possible reasons:
                        </p>
                        <ul className="space-y-2.5 text-amber-700 dark:text-amber-300/80 pl-1">
                            <li className="flex items-center gap-2.5">
                                <div className="h-1 w-1 rounded-full bg-amber-500/70"></div>
                                You&apos;re not signed in
                            </li>
                            <li className="flex items-center gap-2.5">
                                <div className="h-1 w-1 rounded-full bg-amber-500/70"></div>
                                Your session has expired
                            </li>
                            <li className="flex items-center gap-2.5">
                                <div className="h-1 w-1 rounded-full bg-amber-500/70"></div>
                                Insufficient permissions
                            </li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-2 pb-8">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="w-full sm:w-auto border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                    <Button asChild className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/10">
                        <Link href="/login" className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            Sign In
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full sm:w-auto text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Link href="/" className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
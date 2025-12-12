'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Home, LogIn, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-amber-100 p-4">
                            <ShieldAlert className="h-12 w-12 text-amber-600" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-gray-900">
                            Access Denied
                        </CardTitle>
                        <CardDescription className="text-lg text-gray-600 mt-2">
                            Unauthorized Access
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="text-center">
                    <p className="text-gray-500 mb-4">
                        You don&apos;t have permission to access this page. This area requires special privileges.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <p className="font-medium">Possible reasons:</p>
                        <ul className="mt-2 space-y-1 text-left">
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                                You&apos;re not signed in
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                                Your session has expired
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                                Insufficient permissions
                            </li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="w-full sm:w-auto"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                    <Button asChild variant="default" className="w-full sm:w-auto">
                        <Link href="/login" className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            Sign In
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full sm:w-auto">
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
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, AlertCircle, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              404
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Page Not Found
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-gray-500 mb-2">
            Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <p className="text-sm text-gray-400">
            Error Code: 404
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home Page
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
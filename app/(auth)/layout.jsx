import GoogleAuthProvider from "@/components/providers/GoogleAuthProvider"

export default function AuthLayout({ children }) {
    return (
        <GoogleAuthProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {children}
            </div>
        </GoogleAuthProvider >
    )
}
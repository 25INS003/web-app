/** @type {import('next').NextConfig} */
const nextConfig = {
    // Emits .next/standalone with a self-contained server.js and only the
    // modules actually reached by the build. Without it the production image
    // has to carry the whole node_modules tree (~1.2 GB vs ~200 MB) — which is
    // the difference between a fast and a painful pull on a Raspberry Pi.
    output: 'standalone',
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '72.61.229.147',
                port: '8016',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8016',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: 'media-bucket-api',
                port: '8016',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'randomuser.me',
                port: '',
                pathname: '/**',
            },
            // dev seed product imagery
            {
                protocol: 'https',
                hostname: 'www.themealdb.com',
                port: '',
                pathname: '/**',
            },
            // Non-food seed items (Wikimedia Commons). These replaced the
            // picsum.photos URLs, whose host is unreachable on some networks —
            // every one of them rendered as a broken image.
            {
                protocol: 'https',
                hostname: 'upload.wikimedia.org',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
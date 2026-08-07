/** @type {import('next').NextConfig} */
const nextConfig = {
    // Emits .next/standalone with a self-contained server.js and only the
    // modules actually reached by the build. Without it the production image
    // has to carry the whole node_modules tree (~1.2 GB vs ~200 MB) — which is
    // the difference between a fast and a painful pull on a Raspberry Pi.
    output: 'standalone',

    // Same-origin proxy for running `next dev` on :3000 outside the Docker stack.
    //
    // NEXT_PUBLIC_API_URL is the relative "/api/v1", which only resolves when
    // something in front routes /api to the backend — nginx does that at :8100 in
    // the dev stack, and the Ingress does it in production. A bare `next dev` has
    // neither, so the browser calls localhost:3000/api/v1/... , Next has no such
    // route, and every request 404s. Login looks broken.
    //
    // The fix is a proxy, not a CORS change. Auth is an httpOnly cookie sent with
    // `withCredentials`, and production sets SameSite=Strict — so a cross-origin
    // setup cannot work no matter what Access-Control-Allow-Origin says: the
    // browser simply never returns the cookie, and you get a login loop.
    //
    // Point DEV_API_PROXY at the dev nginx (http://localhost:8100). It already
    // routes /api, /socket.io and /media_api to the right services, so one target
    // covers all three. Leave it unset in Docker and in production, where nginx
    // and the Ingress do the routing and this must not interfere.
    async rewrites() {
        const target = process.env.DEV_API_PROXY;
        if (!target) return [];
        return [
            { source: '/api/:path*', destination: `${target}/api/:path*` },
            { source: '/socket.io/:path*', destination: `${target}/socket.io/:path*` },
            { source: '/media_api/:path*', destination: `${target}/media_api/:path*` },
        ];
    },

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
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Emits .next/standalone with a self-contained server.js and only the
    // modules actually reached by the build. Without it the production image
    // has to carry the whole node_modules tree (~1.2 GB vs ~200 MB) — which is
    // the difference between a fast and a painful pull on a Raspberry Pi.
    output: 'standalone',

    // Who may load the dev server's own assets.
    //
    // `next dev` blocks cross-origin requests to dev-only endpoints (`/_next/hmr`
    // and the dev runtime) from any host other than the one it was started on.
    // The failure is quiet and easy to misread: the page still server-renders,
    // so it LOOKS fine — hero, headings, and skeleton placeholders all present —
    // but React never hydrates, so no client query ever runs, no request is made
    // to /api, and the product sections stay as skeletons forever. There is no
    // console error; the only evidence is a warning in the dev server's own log.
    //
    // This matters here because the stack is reached from another machine: nginx
    // publishes :80 on the host, and the browser is usually not on that host.
    // Anything not in this list gets the empty-looking homepage above.
    //
    // DEVELOPMENT ONLY — the option has no effect on a production build, so it
    // widens nothing in the deployed image.
    allowedDevOrigins: [
        // The Tailscale address of the dev box; the tailnet is how the cluster
        // and the team already reach it.
        '100.110.41.59',
        // LAN.
        '10.11.43.225',
        // Hostname-based access, e.g. http://navrobotec/ on the local network.
        'navrobotec',
        '*.local',
        '*.ts.net',
    ],

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
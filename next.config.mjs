/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '72.61.229.147',
                port: '8016',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
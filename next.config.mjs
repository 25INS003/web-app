/** @type {import('next').NextConfig} */
const nextConfig = {
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
        ],
    },
};

export default nextConfig;
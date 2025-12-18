/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://72.61.229.147:3000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Dashboard PNGs are served locally from /public/dashboards.
    // Extend this list if dashboards are ever hosted remotely.
    remotePatterns: [],
  },
};

export default nextConfig;

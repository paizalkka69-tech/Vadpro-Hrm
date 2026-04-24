/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Vadpro-Hrm',
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  trailingSlash: true,
};

export default nextConfig;

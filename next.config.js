/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdfjs-dist"],
  experimental: {
    optimizePackageImports: ["recharts", "dayjs"],
  },
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  async redirects() {
    return [
      {
        source: "/report",
        destination: "/reports",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
